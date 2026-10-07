#!/usr/bin/env node
// Copyright 2026 openduo
// SPDX-License-Identifier: FSL-1.1-Apache-2.0

/**
 * REFERENCE IMPLEMENTATION, NOT SUPPORTED. Whoever deploys it owns its security.
 *
 * The relay connector: keeps one outbound WebSocket to a relay (worker/src/worker.js here, or
 * any relay speaking the frame format in ../relay-protocol.md) and forwards each request frame over HTTP to
 * the tether channel's loopback port. Requests are multiplexed and answered in any order. A
 * `text/event-stream` answer, and any answer whose frame would exceed the frame limit, goes back
 * as response-start, response-chunk and response-end frames; the relay's `cancel` ends it.
 *
 * Node 22 or later, no dependencies: the global WebSocket and fetch.
 *
 * Environment (the secret only ever from the environment, never an argument):
 *   TETHER_RELAY_URL                 required  wss://<relay>/connect (plain ws:// only to loopback)
 *   TETHER_RELAY_SECRET              required  the bearer secret the relay checks
 *   TETHER_UPSTREAM                  required  http://127.0.0.1:<ALADUO_TETHER_PORT>
 *   TETHER_RELAY_MAX_REQUEST_BYTES   1 MiB     larger requests get 413 and reach nothing
 *   TETHER_RELAY_MAX_FRAME_BYTES     1 MiB     one frame to the relay; larger answers are cut
 *   TETHER_RELAY_DISPATCH_TIMEOUT_MS 25 s      until an answer starts; then 504
 *   TETHER_RELAY_KEEPALIVE_MS        30 s      ping interval; an unanswered ping drops the link
 *   TETHER_RELAY_BACKOFF_MIN_MS      1 s       reconnect delay, doubling per failure ...
 *   TETHER_RELAY_BACKOFF_MAX_MS      10 s      ... up to this
 */

const MIB = 1024 * 1024;

/** Defaults, each overridable by its key. */
const DEFAULTS = {
  /** Cloudflare's WebSocket message limit: one relay message carries one request. */
  TETHER_RELAY_MAX_REQUEST_BYTES: MIB,
  /** The same limit for one frame back; a larger answer is cut into frames. */
  TETHER_RELAY_MAX_FRAME_BYTES: MIB,
  /** Below the reference Worker's 30 s, so the connector's 504 arrives before the relay's. */
  TETHER_RELAY_DISPATCH_TIMEOUT_MS: 25_000,
  /** One missed pong at the next ping marks the link dead. */
  TETHER_RELAY_KEEPALIVE_MS: 30_000,
  TETHER_RELAY_BACKOFF_MIN_MS: 1_000,
  TETHER_RELAY_BACKOFF_MAX_MS: 10_000
};

/** The headers passed each way; nothing else crosses, cookies included. */
const REQUEST_HEADERS = [
  "content-type",
  "accept",
  "authorization",
  "mcp-protocol-version",
  "mcp-method",
  "mcp-name",
  "origin"
];
const RESPONSE_HEADERS = [
  "content-type",
  "x-accel-buffering",
  "www-authenticate",
  "location",
  "cache-control",
  "content-security-policy",
  "referrer-policy"
];

function fail(message) {
  process.stderr.write(`tether relay connector: ${message}\n`);
  process.exit(1);
}

function log(level, message) {
  process.stderr.write(`${new Date().toISOString()} ${level} ${message}\n`);
}

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Secure anywhere; plaintext only to this machine. */
function parseUrl(key, secure, plain) {
  const raw = process.env[key]?.trim();
  if (!raw) fail(`${key} is not set`);
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(`${key} is not a URL`);
  }
  if (url.protocol === `${secure}:`) return url;
  if (url.protocol === `${plain}:` && isLoopback(url.hostname)) return url;
  fail(`${key} must be ${secure}:// (plain ${plain}:// only to a loopback address)`);
}

function positiveInteger(key) {
  const raw = process.env[key]?.trim();
  if (!raw) return DEFAULTS[key];
  if (!/^\d+$/.test(raw) || Number(raw) < 1) fail(`${key} is not a positive whole number`);
  return Number(raw);
}

function chunkFrame(id, data) {
  return JSON.stringify({ type: "response-chunk", id, data });
}

/** The smallest response-chunk frame: a frame limit below it cannot carry an answer at all. */
const SMALLEST_CHUNK_FRAME_BYTES = Buffer.byteLength(chunkFrame("", "\u0000"));

function readConfig() {
  const relayUrl = parseUrl("TETHER_RELAY_URL", "wss", "ws");
  const upstream = parseUrl("TETHER_UPSTREAM", "https", "http");
  const secret = process.env.TETHER_RELAY_SECRET?.trim();
  if (!secret) fail("TETHER_RELAY_SECRET is not set");
  const config = {
    relayUrl: relayUrl.href,
    upstream: upstream.origin,
    secret,
    maxRequestBytes: positiveInteger("TETHER_RELAY_MAX_REQUEST_BYTES"),
    maxFrameBytes: positiveInteger("TETHER_RELAY_MAX_FRAME_BYTES"),
    dispatchTimeoutMs: positiveInteger("TETHER_RELAY_DISPATCH_TIMEOUT_MS"),
    keepaliveMs: positiveInteger("TETHER_RELAY_KEEPALIVE_MS"),
    backoffMinMs: positiveInteger("TETHER_RELAY_BACKOFF_MIN_MS"),
    backoffMaxMs: positiveInteger("TETHER_RELAY_BACKOFF_MAX_MS")
  };
  if (config.maxFrameBytes < SMALLEST_CHUNK_FRAME_BYTES) {
    fail(`TETHER_RELAY_MAX_FRAME_BYTES is below ${SMALLEST_CHUNK_FRAME_BYTES}, too small for any answer`);
  }
  if (config.backoffMaxMs < config.backoffMinMs) {
    fail("TETHER_RELAY_BACKOFF_MAX_MS is below TETHER_RELAY_BACKOFF_MIN_MS");
  }
  return config;
}

function pick(headers, allowed) {
  const out = {};
  for (const [name, value] of Object.entries(headers ?? {})) {
    const key = name.toLowerCase();
    if (allowed.includes(key) && typeof value === "string") out[key] = value;
  }
  return out;
}

function errorResponse(status, message) {
  return {
    status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ error: status, message })
  };
}

function parseFrame(raw) {
  let frame;
  try {
    frame = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof frame !== "object" || frame === null) return null;
  if (typeof frame.id !== "string" || frame.id === "") return null;
  if (frame.type === "cancel") return { type: "cancel", id: frame.id };
  if (frame.type !== "request") return null;
  if (frame.method !== "GET" && frame.method !== "POST") return null;
  if (typeof frame.path !== "string" || !frame.path.startsWith("/")) return null;
  return {
    type: "request",
    id: frame.id,
    request: {
      method: frame.method,
      path: frame.path,
      query: typeof frame.query === "string" ? frame.query : "",
      headers: typeof frame.headers === "object" ? pick(frame.headers, REQUEST_HEADERS) : {},
      body: typeof frame.body === "string" ? frame.body : ""
    }
  };
}

/**
 * `text` cut so each response-chunk frame for `id` fits `maxBytes`, JSON escaping included.
 * Greedy over code points, so a surrogate pair is never split.
 */
function* pieces(text, id, maxBytes) {
  if (Buffer.byteLength(chunkFrame(id, text)) <= maxBytes) {
    yield text;
    return;
  }
  const budget = maxBytes - Buffer.byteLength(chunkFrame(id, ""));
  let start = 0;
  let size = 0;
  let index = 0;
  for (const char of text) {
    // Each code point escapes on its own: its cost in the frame is additive.
    const cost = Buffer.byteLength(JSON.stringify(char)) - 2;
    if (size + cost > budget && index > start) {
      yield text.slice(start, index);
      start = index;
      size = 0;
    }
    size += cost;
    index += char.length;
  }
  if (index > start) yield text.slice(start, index);
}

/**
 * One request to the channel over HTTP. An event stream is handed on while it is written;
 * any other answer is read whole. Aborting `signal` ends either.
 */
async function forward(config, request, signal) {
  const response = await fetch(`${config.upstream}${request.path}${request.query}`, {
    method: request.method,
    headers: request.headers,
    redirect: "manual",
    signal,
    ...(request.method === "POST" ? { body: request.body } : {})
  });
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name] = value;
  });
  if (headers["content-type"]?.startsWith("text/event-stream") && response.body !== null) {
    return { status: response.status, headers, chunks: response.body };
  }
  return { status: response.status, headers, body: await response.text() };
}

/** The time limit runs until the answer starts: a stream then lives on. */
async function dispatch(config, request, signal) {
  if (Buffer.byteLength(request.body) > config.maxRequestBytes) {
    return errorResponse(413, "The request is larger than the relay accepts. Nothing reached duoduo.");
  }
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(
      () =>
        resolve(
          errorResponse(504, "duoduo did not answer in time; the outcome of this request is unknown.")
        ),
      config.dispatchTimeoutMs
    );
  });
  let answer;
  try {
    answer = await Promise.race([forward(config, request, signal), timeout]);
  } catch (error) {
    answer = errorResponse(502, `The tether channel failed this request (${String(error)}).`);
  } finally {
    clearTimeout(timer);
  }
  return { ...answer, headers: pick(answer.headers, RESPONSE_HEADERS) };
}

function connector(config) {
  let socket = null;
  let delayMs = config.backoffMinMs;
  let retryTimer = null;
  let stopped = false;

  async function answer(ws, raw, inflight) {
    const frame = parseFrame(raw);
    if (frame === null) {
      log("WARN", "the relay sent a frame that is neither a request nor a cancel; ignored");
      return;
    }
    if (frame.type === "cancel") {
      inflight.get(frame.id)?.abort();
      return;
    }
    const controller = new AbortController();
    inflight.set(frame.id, controller);
    const open = () => !controller.signal.aborted && ws.readyState === WebSocket.OPEN;
    const sendData = (text) => {
      // A chunk ending inside a UTF-8 sequence can decode to nothing yet.
      if (text === "") return;
      for (const data of pieces(text, frame.id, config.maxFrameBytes)) ws.send(chunkFrame(frame.id, data));
    };
    let started = false;
    try {
      const result = await dispatch(config, frame.request, controller.signal);
      // An answer goes back only on the socket its request came on.
      if (!open()) return;
      if ("body" in result) {
        const whole = JSON.stringify({ type: "response", id: frame.id, ...result });
        if (Buffer.byteLength(whole) <= config.maxFrameBytes) {
          ws.send(whole);
          return;
        }
      }
      ws.send(
        JSON.stringify({ type: "response-start", id: frame.id, status: result.status, headers: result.headers })
      );
      started = true;
      if ("body" in result) {
        // Too large for one frame: the same frames as a stream.
        sendData(result.body);
        return;
      }
      const decoder = new TextDecoder();
      for await (const chunk of result.chunks) {
        if (!open()) return;
        sendData(decoder.decode(chunk, { stream: true }));
      }
      if (open()) sendData(decoder.decode());
    } catch (error) {
      // A cancelled stream ends its reader with an abort error: nothing to report.
      if (!controller.signal.aborted) log("WARN", `stream ${frame.id} failed: ${String(error)}`);
    } finally {
      // A started answer that ended or failed still ends at the relay; a cancelled one is gone already.
      if (started && open()) ws.send(JSON.stringify({ type: "response-end", id: frame.id }));
      controller.abort();
      inflight.delete(frame.id);
    }
  }

  function connect() {
    if (stopped) return;
    const ws = new WebSocket(config.relayUrl, {
      headers: { authorization: `Bearer ${config.secret}` }
    });
    socket = ws;
    // Requests this socket carries; its end ends every one.
    const inflight = new Map();
    let alive = true;
    let keepalive = null;
    let ended = false;
    /**
     * The socket is done: once, from its close or from a dead keepalive. A dead link may never
     * complete the closing handshake, so the reconnect does not wait for its close event.
     */
    const end = (reason) => {
      if (ended) return;
      ended = true;
      for (const controller of inflight.values()) controller.abort();
      inflight.clear();
      clearInterval(keepalive);
      if (socket === ws) socket = null;
      if (stopped) return;
      log("WARN", `relay disconnected (${reason}); reconnecting in ${delayMs} ms`);
      retryTimer = setTimeout(connect, delayMs);
      delayMs = Math.min(delayMs * 2, config.backoffMaxMs);
    };
    ws.addEventListener("open", () => {
      delayMs = config.backoffMinMs;
      log("INFO", "relay connected");
      // A ping still unanswered when the next one is due means the link is dead.
      keepalive = setInterval(() => {
        if (!alive) {
          end("keepalive unanswered");
          ws.close();
          return;
        }
        alive = false;
        ws.send("ping");
      }, config.keepaliveMs);
    });
    ws.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      if (event.data === "pong") {
        alive = true;
        return;
      }
      void answer(ws, event.data, inflight);
    });
    // A refused handshake (a wrong secret, a wrong URL) closes with 1006 and no HTTP status.
    ws.addEventListener("close", (event) => end(`code ${event.code}`));
  }

  return {
    start: connect,
    stop() {
      stopped = true;
      clearTimeout(retryTimer);
      socket?.close();
    }
  };
}

const running = connector(readConfig());
running.start();
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    running.stop();
    process.exit(0);
  });
}
