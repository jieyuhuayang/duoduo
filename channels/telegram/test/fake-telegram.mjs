// A minimal stand-in for the Telegram Bot API, for end-to-end tests.
//
//   node test/fake-telegram.mjs <port>
//
// Bot API:  POST /bot<token>/{getMe,getUpdates,sendMessage,sendChatAction,sendDocument,getFile}
//           GET  /file/bot<token>/<file_path>
// Control:  POST /_inject  {message: {...}}   queue an update (update_id assigned here)
//           GET  /_sent                        every sendMessage / sendDocument so far
//           GET  /_calls                       count per Bot API method

import http from "node:http";

const port = Number(process.argv[2] ?? 18080);
const TOKEN = "123:TEST";
const updates = [];
const sent = [];
const calls = {};
const waiters = new Set();
let nextUpdateId = 1000;

const FILES = { "photos/file_1.jpg": Buffer.from("fake-jpeg-bytes") };

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}

function pending(offset) {
  return updates.filter((u) => u.update_id >= offset);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const raw = await readBody(req);

  if (url.pathname === "/_inject") {
    const update = { update_id: nextUpdateId++, ...JSON.parse(raw.toString()) };
    updates.push(update);
    for (const w of waiters) w();
    return json(res, 200, { update_id: update.update_id });
  }
  if (url.pathname === "/_sent") return json(res, 200, sent);
  if (url.pathname === "/_calls") return json(res, 200, calls);

  if (url.pathname.startsWith(`/file/bot${TOKEN}/`)) {
    const bytes = FILES[url.pathname.slice(`/file/bot${TOKEN}/`.length)];
    if (!bytes) { res.writeHead(404); return res.end(); }
    res.writeHead(200);
    return res.end(bytes);
  }

  const m = url.pathname.match(/^\/bot([^/]+)\/(\w+)$/);
  if (!m) { res.writeHead(404); return res.end(); }
  if (m[1] !== TOKEN) return json(res, 401, { ok: false, error_code: 401, description: "Unauthorized" });
  const method = m[2];
  calls[method] = (calls[method] ?? 0) + 1;
  const ctype = req.headers["content-type"] ?? "";
  const body = ctype.startsWith("application/json") && raw.length ? JSON.parse(raw.toString()) : {};

  switch (method) {
    case "getMe":
      return json(res, 200, { ok: true, result: { id: 42, is_bot: true, username: "duoduo_test_bot" } });
    case "getUpdates": {
      const offset = body.offset ?? 0;
      // Telegram forgets updates below the confirmed offset.
      for (let i = updates.length - 1; i >= 0; i--) if (updates[i].update_id < offset) updates.splice(i, 1);
      let ready = pending(offset);
      if (ready.length === 0) {
        await new Promise((resolve) => {
          const done = () => { waiters.delete(done); clearTimeout(t); resolve(); };
          const t = setTimeout(done, Math.min(body.timeout ?? 0, 5) * 1000);
          waiters.add(done);
          req.on("close", done);
        });
        ready = pending(offset);
      }
      return json(res, 200, { ok: true, result: ready });
    }
    case "sendMessage":
      sent.push({ kind: "text", chat_id: body.chat_id, text: body.text });
      return json(res, 200, { ok: true, result: { message_id: sent.length } });
    case "sendChatAction":
      return json(res, 200, { ok: true, result: true });
    case "sendDocument": {
      // multipart: record only that a document arrived and its file name
      const name = /filename="([^"]+)"/.exec(raw.toString("latin1"))?.[1] ?? "?";
      sent.push({ kind: "document", name });
      return json(res, 200, { ok: true, result: { message_id: sent.length } });
    }
    case "getFile":
      return json(res, 200, { ok: true, result: { file_id: body.file_id, file_path: "photos/file_1.jpg" } });
    default:
      return json(res, 400, { ok: false, error_code: 400, description: `unknown method ${method}` });
  }
});

server.listen(port, "127.0.0.1", () => process.stdout.write(`fake telegram on ${port}\n`));
