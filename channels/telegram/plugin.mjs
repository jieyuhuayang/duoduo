#!/usr/bin/env node
// Telegram channel adapter for duoduo.
//
// One process, no dependencies (Node >= 20). It moves messages between the
// Telegram Bot API and the duoduo daemon's JSON-RPC control plane:
//
//   Telegram getUpdates (long poll) -> channel.file.upload (attachments)
//                                   -> channel.ingress
//   channel.pull over HTTP (poll)   -> Telegram sendMessage / sendDocument
//                                   -> channel.ack (only after Telegram accepted it)
//
// Delivery is at-least-once in both directions: the Telegram offset advances
// only after the daemon accepted the message (the idempotency key makes a
// retry harmless), and the outbox cursor advances only after Telegram
// accepted the reply.
//
// Scope of this version: private chats only; users not in TELEGRAM_ALLOW_FROM
// are ignored; replies are sent as plain text.

import http from "node:http";
import https from "node:https";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// ---------------------------------------------------------------- config

const env = process.env;
const CHANNEL_KIND = "telegram";
const CONSUMER_ID = "telegram-gw";
const TEXT_LIMIT = 4000; // Telegram allows 4096 characters per message
const TYPING_INTERVAL_MS = 4500; // a chat action shows for about 5 s
const TYPING_MAX_MS = 10 * 60 * 1000;
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const IDLE_PULL_MS = 10_000;

function expandHome(p) {
  return p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p;
}

const config = {
  token: env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
  apiBase: (env.TELEGRAM_API_BASE?.trim() || "https://api.telegram.org").replace(/\/+$/, ""),
  allowFrom: new Set(
    (env.TELEGRAM_ALLOW_FROM ?? "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  proxy: env.TELEGRAM_PROXY?.trim() ?? "",
  stateDir: expandHome(env.TELEGRAM_STATE_DIR?.trim() || "~/.cache/telegram-channel"),
  pollMs: Math.max(250, Number(env.TELEGRAM_OUTBOX_POLL_MS) || 1500),
  logLevel: (env.TELEGRAM_LOG_LEVEL?.trim() || "info").toLowerCase(),
};

// ---------------------------------------------------------------- logging

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function log(level, msg) {
  if ((LEVELS[level] ?? 20) < threshold) return;
  const line = `${new Date().toISOString()} [telegram] ${level.toUpperCase()} ${msg}\n`;
  (level === "error" || level === "warn" ? process.stderr : process.stdout).write(line);
}

// ---------------------------------------------------------------- daemon RPC

class DaemonUnavailableError extends Error {}
class RpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Same resolution order as the official adapters: an absolute
// ALADUO_DAEMON_SOCKET, else ALADUO_DAEMON_URL (+ ALADUO_DAEMON_TOKEN), else
// the default socket under the runtime directory.
function resolveDaemonTransport() {
  const socket = env.ALADUO_DAEMON_SOCKET?.trim();
  if (socket && path.isAbsolute(socket)) return { kind: "socket", socketPath: socket };
  const url = env.ALADUO_DAEMON_URL?.trim();
  if (url) {
    return {
      kind: "tcp",
      url: url.replace(/\/+$/, "").replace(/^ws(s?):/i, "http$1:"),
      token: env.ALADUO_DAEMON_TOKEN?.trim() || undefined,
    };
  }
  const runtimeDir = env.ALADUO_RUNTIME_DIR?.trim() || path.join(os.homedir(), ".aladuo");
  return { kind: "socket", socketPath: path.join(runtimeDir, "run", "daemon.sock") };
}

const transport = resolveDaemonTransport();
let rpcId = 0;
// Own agents, so that a process-wide proxy (NODE_USE_ENV_PROXY=1 makes the
// global agents follow HTTP(S)_PROXY) never applies to a TCP daemon URL. A
// unix-socket request is direct either way (measured on Node 24.21).
const daemonAgents = { http: new http.Agent({ keepAlive: true }), https: new https.Agent({ keepAlive: true }) };

function rpc(method, params, timeoutMs = 30_000) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params });
  const headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  };
  let options;
  let lib = http;
  if (transport.kind === "socket") {
    options = { socketPath: transport.socketPath, path: "/rpc", method: "POST", headers, agent: daemonAgents.http };
  } else {
    const u = new URL("/rpc", transport.url + "/");
    lib = u.protocol === "https:" ? https : http;
    if (transport.token) headers.Authorization = `Bearer ${transport.token}`;
    options = {
      hostname: u.hostname, port: u.port, path: u.pathname, method: "POST", headers,
      agent: u.protocol === "https:" ? daemonAgents.https : daemonAgents.http,
    };
  }
  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode !== 200) {
          reject(new DaemonUnavailableError(`daemon answered HTTP ${res.statusCode} to ${method}`));
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          reject(new DaemonUnavailableError(`daemon sent invalid JSON for ${method}`));
          return;
        }
        if (parsed.error) reject(new RpcError(parsed.error.code, parsed.error.message ?? "RPC error"));
        else resolve(parsed.result);
      });
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs} ms`)));
    req.on("error", (err) => reject(new DaemonUnavailableError(`${method}: ${err.message}`)));
    req.end(body);
  });
}

// ---------------------------------------------------------------- Telegram API

class TelegramError extends Error {
  constructor(method, status, description, retryAfter) {
    super(`${method}: ${status} ${description}`);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

// Telegram traffic uses its own agents. TELEGRAM_PROXY, when set, applies to
// them only (Node's per-agent proxyEnv, Node >= 24.5); the daemon connection
// and the process-wide HTTP(S)_PROXY variables are not involved.
const tgAgents = {
  https: new https.Agent({ keepAlive: true, ...(config.proxy ? { proxyEnv: { HTTPS_PROXY: config.proxy } } : {}) }),
  http: new http.Agent({ keepAlive: true, ...(config.proxy ? { proxyEnv: { HTTP_PROXY: config.proxy } } : {}) }),
};

// One HTTP exchange with the Telegram API. Resolves { status, body: Buffer }.
// Rejects with an AbortError when the caller's signal fires, else with the
// socket error (its code, never the URL).
function tgRequest(url, { method = "GET", headers = {}, body, signal, timeoutMs }) {
  const u = new URL(url);
  const lib = u.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    const req = lib.request(u, { method, headers, agent: u.protocol === "https:" ? tgAgents.https : tgAgents.http }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    const onAbort = () => req.destroy(Object.assign(new Error("aborted"), { name: "AbortError" }));
    signal?.addEventListener("abort", onAbort, { once: true });
    req.on("close", () => signal?.removeEventListener("abort", onAbort));
    req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    req.on("error", reject);
    req.end(body);
  });
}

// The token is part of every URL, so no URL ever goes into a log line or an
// error message; only the method name does.
async function tg(method, payload, { signal, timeoutMs = 60_000 } = {}) {
  let body;
  const headers = {};
  if (payload instanceof FormData) {
    // Let the platform encode the multipart body and its boundary.
    const encoded = new Response(payload);
    body = Buffer.from(await encoded.arrayBuffer());
    headers["Content-Type"] = encoded.headers.get("content-type");
  } else {
    body = Buffer.from(JSON.stringify(payload ?? {}));
    headers["Content-Type"] = "application/json";
  }
  headers["Content-Length"] = body.length;
  let res;
  try {
    res = await tgRequest(`${config.apiBase}/bot${config.token}/${method}`, { method: "POST", headers, body, signal, timeoutMs });
  } catch (err) {
    if (err.name === "AbortError" && signal?.aborted) throw err;
    throw new TelegramError(method, 0, err.code ?? err.name ?? "network error");
  }
  let data;
  try {
    data = JSON.parse(res.body.toString("utf8"));
  } catch {
    throw new TelegramError(method, res.status, "non-JSON response");
  }
  if (!data.ok) {
    throw new TelegramError(method, data.error_code ?? res.status, data.description ?? "error", data.parameters?.retry_after);
  }
  return data.result;
}

async function tgDownload(fileId) {
  const file = await tg("getFile", { file_id: fileId });
  if (!file.file_path) throw new Error("getFile returned no file_path");
  let res;
  try {
    res = await tgRequest(`${config.apiBase}/file/bot${config.token}/${file.file_path}`, { timeoutMs: 120_000 });
  } catch (err) {
    throw new Error(`file download: ${err.code ?? err.name}`);
  }
  if (res.status !== 200) throw new Error(`file download: HTTP ${res.status}`);
  return { bytes: res.body, filePath: file.file_path };
}

// ---------------------------------------------------------------- state

// state.json: { offset, sessions: { [sessionKey]: { chatId, lastActive } } }
let state = { offset: 0, sessions: {} };
const statePath = path.join(config.stateDir, "state.json");

async function loadState() {
  await fs.mkdir(config.stateDir, { recursive: true, mode: 0o700 });
  try {
    const raw = JSON.parse(await fs.readFile(statePath, "utf8"));
    state = { offset: Number(raw.offset) || 0, sessions: raw.sessions ?? {} };
  } catch (err) {
    if (err.code !== "ENOENT") log("warn", `state file unreadable, starting empty: ${err.message}`);
  }
}

let saving = Promise.resolve();
function saveState() {
  saving = saving.then(async () => {
    const tmp = `${statePath}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
    await fs.rename(tmp, statePath);
  }).catch((err) => log("error", `saving state failed: ${err.message}`));
  return saving;
}

// ---------------------------------------------------------------- helpers

// Resolves after ms, on abort, or when the function handed to onWaiting is
// called. The abort listener is removed on every path, so long-running loops
// do not pile up listeners on the signal.
function sleep(ms, signal, onWaiting) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    let timer;
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    timer = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
    onWaiting?.(done);
  });
}

function sessionKeyFor(chatId) {
  return `${CHANNEL_KIND}:${chatId}`;
}

// channel_id must match [A-Za-z0-9_-]{1,128}; a chat id is an integer.
function channelIdFor(chatId) {
  return `${CHANNEL_KIND}-${chatId}`;
}

// Split at a newline or a space where possible, so a long reply arrives as
// several readable messages.
function splitText(text, limit = TEXT_LIMIT) {
  const parts = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut < limit / 2) cut = rest.lastIndexOf(" ", limit);
    if (cut < limit / 2) cut = limit;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest.length > 0) parts.push(rest);
  return parts;
}

const MIME_BY_EXT = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif",
  ".webp": "image/webp", ".pdf": "application/pdf", ".txt": "text/plain", ".md": "text/markdown",
  ".ogg": "audio/ogg", ".oga": "audio/ogg", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".mp4": "video/mp4", ".json": "application/json", ".csv": "text/csv",
};
function guessMime(name) {
  return MIME_BY_EXT[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

// ---------------------------------------------------------------- typing indicator

const typing = new Map(); // chatId -> deadline (ms)

async function typingLoop(signal) {
  while (!signal.aborted) {
    const now = Date.now();
    for (const [chatId, deadline] of typing) {
      if (now > deadline) { typing.delete(chatId); continue; }
      tg("sendChatAction", { chat_id: chatId, action: "typing" }, { timeoutMs: 10_000 })
        .catch((err) => log("debug", `sendChatAction failed: ${err.message}`));
    }
    await sleep(TYPING_INTERVAL_MS, signal);
  }
}

// ---------------------------------------------------------------- inbound

let botUsername = "";

const ATTACHMENT_KINDS = ["document", "photo", "voice", "audio", "video", "video_note"];

async function collectAttachments(msg, sessionKey) {
  const attachments = [];
  const failures = [];
  for (const kind of ATTACHMENT_KINDS) {
    let item = msg[kind];
    if (!item) continue;
    if (kind === "photo") item = item[item.length - 1]; // the largest size
    const fallbackName = `${kind}-${msg.message_id}`;
    try {
      const { bytes, filePath } = await tgDownload(item.file_id);
      const name = item.file_name || `${fallbackName}${path.extname(filePath)}`;
      const mime = item.mime_type || guessMime(name);
      const uploaded = await rpc("channel.file.upload", {
        session_key: sessionKey,
        name,
        mime,
        content_base64: bytes.toString("base64"),
      }, 120_000);
      attachments.push({ path: uploaded.path, mime: uploaded.mime ?? mime });
    } catch (err) {
      if (err instanceof DaemonUnavailableError) throw err;
      log("warn", `attachment ${kind} of message ${msg.message_id} not delivered: ${err.message}`);
      failures.push(item.file_name || kind);
    }
  }
  return { attachments, failures };
}

async function reply(chatId, text) {
  try {
    await tg("sendMessage", { chat_id: chatId, text });
  } catch (err) {
    log("warn", `reply to chat ${chatId} failed: ${err.message}`);
  }
}

// Returns normally when the update is finished (handled or deliberately
// dropped). Throws DaemonUnavailableError when it must be retried later.
async function handleUpdate(update) {
  const msg = update.message;
  if (!msg) return;
  const chat = msg.chat;
  const from = msg.from;

  if (chat.type !== "private") {
    log("info", `ignored message in ${chat.type} chat ${chat.id}: only private chats are supported`);
    return;
  }
  if (!from || !config.allowFrom.has(String(from.id))) {
    log("warn",
      `ignored message from user ${from?.id ?? "?"}${from?.username ? ` (@${from.username})` : ""}: ` +
      `not in TELEGRAM_ALLOW_FROM. Add the id there to allow this user.`);
    return;
  }

  let text = msg.text ?? msg.caption ?? "";
  // "/status@my_bot" -> "/status", so the daemon recognises its commands.
  if (botUsername) text = text.replace(new RegExp(`^(/\\w+)@${botUsername}\\b`, "i"), "$1");

  if (/^\/start\b/.test(text)) {
    await reply(chat.id,
      "已连接 duoduo。直接发消息即可。\n/status 查看会话状态，/clear 重置会话，/model 查看或切换模型。");
    return;
  }

  const sessionKey = sessionKeyFor(chat.id);
  const { attachments, failures } = await collectAttachments(msg, sessionKey);
  if (failures.length > 0) {
    text = `${text}\n\n[附件未能接收：${failures.join("、")}]`.trim();
  }
  if (!text && attachments.length === 0) {
    log("debug", `ignored message ${msg.message_id}: no text and no supported attachment`);
    return;
  }

  const displayName = from.username || [from.first_name, from.last_name].filter(Boolean).join(" ");
  try {
    const result = await rpc("channel.ingress", {
      session_key: sessionKey,
      text,
      ...(attachments.length > 0 ? { attachments } : {}),
      idempotency_key: `${CHANNEL_KIND}:${chat.id}:${msg.message_id}`,
      source_kind: CHANNEL_KIND,
      channel_id: channelIdFor(chat.id),
      ...(displayName ? { display_name: `tg-${displayName}` } : {}),
    });
    log("info", `inbound chat=${chat.id} msg=${msg.message_id} chars=${text.length} ` +
      `attachments=${attachments.length} event=${result.event_id}`);
  } catch (err) {
    if (err instanceof DaemonUnavailableError) throw err;
    // -32010 (workspace unusable), -32011 (session being archived) and
    // parameter errors: tell the user, do not retry.
    log("warn", `channel.ingress refused message ${msg.message_id}: ${err.message}`);
    await reply(chat.id, `duoduo 没有接收这条消息：${err.message}`);
    return;
  }

  const now = Date.now();
  state.sessions[sessionKey] = { chatId: chat.id, lastActive: now };
  typing.set(chat.id, now + TYPING_MAX_MS);
  wakeOutbound();
}

async function inboundLoop(signal) {
  let backoff = 0;
  const delays = [2_000, 5_000, 10_000, 30_000, 60_000];
  while (!signal.aborted) {
    try {
      const updates = await tg("getUpdates", {
        offset: state.offset,
        timeout: 30,
        allowed_updates: ["message"],
      }, { signal, timeoutMs: 45_000 });
      for (const update of updates) {
        await handleUpdate(update);
        state.offset = update.update_id + 1;
        await saveState();
      }
      backoff = 0;
    } catch (err) {
      if (signal.aborted) return;
      const wait = err.retryAfter ? err.retryAfter * 1000 : delays[Math.min(backoff, delays.length - 1)];
      backoff += 1;
      const what = err instanceof DaemonUnavailableError ? "daemon unreachable" : "Telegram poll failed";
      log("warn", `${what} (${err.message}); retrying in ${Math.round(wait / 1000)} s`);
      await sleep(wait, signal);
    }
  }
}

// ---------------------------------------------------------------- outbound

let wake = null;
function wakeOutbound() {
  wake?.();
}

async function sendAttachment(chatId, att) {
  const { content_base64: b64 } = await rpc("channel.file.download", { path: att.path }, 120_000);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([Buffer.from(b64, "base64")], { type: att.mime }), path.basename(att.path));
  await tg("sendDocument", form, { timeoutMs: 120_000 });
}

// Returns true when the record is finished (sent, or permanently undeliverable).
async function deliverRecord(chatId, record) {
  const text = typeof record.payload?.text === "string" ? record.payload.text.trim() : "";
  const attachments = Array.isArray(record.payload?.attachments) ? record.payload.attachments : [];
  try {
    for (const part of splitText(text)) {
      await tg("sendMessage", { chat_id: chatId, text: part, link_preview_options: { is_disabled: true } });
    }
    for (const att of attachments) {
      if (typeof att?.path !== "string") continue;
      try {
        await sendAttachment(chatId, att);
      } catch (err) {
        if (err instanceof TelegramError && (err.status === 0 || err.status === 429 || err.status >= 500)) throw err;
        log("warn", `attachment ${path.basename(att.path)} of ${record.id} not sent: ${err.message}`);
      }
    }
    return true;
  } catch (err) {
    // 4xx other than 429 will not succeed on retry (chat gone, bot blocked):
    // drop the record so it does not block the session's queue.
    if (err instanceof TelegramError && err.status >= 400 && err.status < 500 && err.status !== 429) {
      log("error", `record ${record.id} dropped for chat ${chatId}: ${err.message}`);
      return true;
    }
    throw err;
  }
}

async function pullSession(sessionKey, info) {
  const result = await rpc("channel.pull", {
    session_key: sessionKey,
    consumer_id: CONSUMER_ID,
    limit: 20,
    return_mask: ["final"],
  });
  for (const record of result.records ?? []) {
    await deliverRecord(info.chatId, record);
    await rpc("channel.ack", { session_key: sessionKey, consumer_id: CONSUMER_ID, cursor: record.id });
    typing.delete(info.chatId);
    log("info", `outbound chat=${info.chatId} record=${record.id} chars=${record.payload?.text?.length ?? 0}`);
  }
}

async function outboundLoop(signal) {
  const lastPulled = new Map();
  let daemonDown = false;
  while (!signal.aborted) {
    const now = Date.now();
    for (const [sessionKey, info] of Object.entries(state.sessions)) {
      if (signal.aborted) return;
      const active = typing.has(info.chatId) || now - (info.lastActive ?? 0) < ACTIVE_WINDOW_MS;
      const interval = active ? config.pollMs : IDLE_PULL_MS;
      if (now - (lastPulled.get(sessionKey) ?? 0) < interval) continue;
      lastPulled.set(sessionKey, now);
      try {
        await pullSession(sessionKey, info);
        if (daemonDown) log("info", "daemon reachable again");
        daemonDown = false;
      } catch (err) {
        if (err instanceof DaemonUnavailableError) {
          if (!daemonDown) log("warn", `daemon unreachable: ${err.message}`);
          daemonDown = true;
          break;
        }
        if (err instanceof RpcError && err.code === -32002) continue; // being archived; retry later
        log("warn", `delivery for ${sessionKey} failed, will retry: ${err.message}`);
        if (err.retryAfter) await sleep(err.retryAfter * 1000, signal);
      }
    }
    await sleep(daemonDown ? 5_000 : config.pollMs, signal, (done) => { wake = done; });
    wake = null;
  }
}

// ---------------------------------------------------------------- main

async function main() {
  if (!config.token) {
    log("error", "TELEGRAM_BOT_TOKEN is not set. Put it in ~/.config/duoduo/.env and start the channel again.");
    process.exit(2);
  }
  if (config.allowFrom.size === 0) {
    log("error", "TELEGRAM_ALLOW_FROM is empty. Refusing to start: everyone would be ignored. " +
      "Set it to your numeric Telegram user id (comma-separated for several).");
    process.exit(2);
  }

  if (config.proxy) {
    const [major, minor] = process.versions.node.split(".").map(Number);
    if (major < 24 || (major === 24 && minor < 5)) {
      log("error", `TELEGRAM_PROXY needs Node 24.5 or later (per-agent proxyEnv); this is Node ${process.versions.node}.`);
      process.exit(2);
    }
    try {
      new URL(config.proxy);
    } catch {
      log("error", "TELEGRAM_PROXY is not a URL; expected for example http://127.0.0.1:7897");
      process.exit(2);
    }
  }

  await loadState();

  const me = await tg("getMe", {}).catch((err) => {
    log("error", `getMe failed, check TELEGRAM_BOT_TOKEN: ${err.message}`);
    process.exit(2);
  });
  botUsername = me.username ?? "";
  log("info", `connected to Telegram as @${botUsername}; allowed users: ${[...config.allowFrom].join(", ")}`);
  log("info", `daemon via ${transport.kind === "socket" ? transport.socketPath : transport.url}`);
  if (config.proxy) {
    const p = new URL(config.proxy);
    log("info", `Telegram via proxy ${p.protocol}//${p.host}`); // host only: a proxy URL may carry credentials
  }

  rpc("system.status", {}, 5_000)
    .then(() => log("info", "daemon reachable"))
    .catch((err) => log("warn", `daemon not reachable yet (${err.message}); will keep retrying`));

  const controller = new AbortController();
  const stop = async (sig) => {
    if (controller.signal.aborted) return;
    log("info", `received ${sig}, shutting down`);
    controller.abort();
    await saveState();
    process.exit(0);
  };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));

  await Promise.all([
    inboundLoop(controller.signal),
    outboundLoop(controller.signal),
    typingLoop(controller.signal),
  ]);
}

main().catch((err) => {
  log("error", `fatal: ${err.stack ?? err.message}`);
  process.exit(1);
});
