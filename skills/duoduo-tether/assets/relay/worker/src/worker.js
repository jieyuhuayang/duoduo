// Copyright 2026 openduo
// SPDX-License-Identifier: FSL-1.1-Apache-2.0

// REFERENCE IMPLEMENTATION, NOT SUPPORTED. Whoever deploys it owns its security.
// tether relay: a Cloudflare Worker. Public HTTPS on the allowed paths goes to one
// WebSocket held open by the relay connector (../../connector.mjs) on the duoduo host.
// Logs nothing about requests: tokens, codes and enrollment secrets pass through here.
// Answers arrive either as one `response` frame, or as a `response-start`/`response-chunk`/`response-end`
// stream (SSE push subscriptions, or an answer larger than one WebSocket frame). Both are supported, so
// this Worker runs with the single-frame connector and the streaming connector alike.
const CONNECT_PATH = "/connect";
const ROUTES = {
  "/mcp": ["GET", "POST"],
  "/.well-known/oauth-protected-resource": ["GET"],
  "/.well-known/oauth-authorization-server": ["GET"],
  "/authorize": ["GET", "POST"],
  "/token": ["POST"],
  "/revoke": ["POST"],
  "/enroll": ["GET"],
  "/enroll/options": ["POST"],
  "/enroll/finish": ["POST"],
};
const REQ_HEADERS = ["content-type", "accept", "authorization", "mcp-protocol-version", "mcp-method", "mcp-name", "origin"];
const RES_HEADERS = ["content-type", "x-accel-buffering", "www-authenticate", "location", "cache-control", "content-security-policy", "referrer-policy"];
const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 30000;

function err(status, message) {
  return new Response(JSON.stringify({ error: status, message }), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
function ctEqual(a, b) {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const stub = () => env.HOST.get(env.HOST.idFromName("host"));
    if (url.pathname === CONNECT_PATH) {
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return err(426, "WebSocket upgrade required");
      const auth = request.headers.get("authorization") || "";
      const expected = "Bearer " + (env.RELAY_SECRET || "");
      if (!env.RELAY_SECRET || !ctEqual(auth, expected)) return err(401, "unauthorized");
      return stub().fetch(new Request("https://relay/connect", { headers: { upgrade: "websocket" }, redirect: "manual" }));
    }
    const methods = ROUTES[url.pathname];
    if (!methods || !methods.includes(request.method)) return err(404, "not found; the request did not reach duoduo");
    const body = request.method === "POST" ? await request.text() : "";
    if (new TextEncoder().encode(body).length > MAX_BYTES) return err(413, "request too large; the request did not reach duoduo");
    const headers = {};
    for (const h of REQ_HEADERS) { const v = request.headers.get(h); if (v !== null) headers[h] = v; }
    return stub().fetch(new Request("https://relay/forward", {
      method: "POST", headers: { "content-type": "application/json" }, redirect: "manual",
      body: JSON.stringify({ method: request.method, path: url.pathname, query: url.search, headers, body }),
    }));
  },
};

export class HostRelay {
  constructor(state) {
    this.state = state;
    this.pending = new Map(); // id -> {ws, resolve, timer, controller, streaming}
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }
  current() {
    const all = this.state.getWebSockets("connector");
    return all.length ? all[all.length - 1] : null;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      for (const old of this.state.getWebSockets("connector")) {
        this.failSocket(old);
        try { old.close(1012, "replaced by a new connector"); } catch {}
      }
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1], ["connector"]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    const ws = this.current();
    if (!ws) return err(503, "duoduo host offline; the request did not reach duoduo");
    const req = await request.json();
    const id = crypto.randomUUID();
    const frame = JSON.stringify({ type: "request", id, ...req });
    const result = new Promise((resolve) => {
      const timer = setTimeout(() => {
        const p = this.pending.get(id);
        if (p && !p.streaming) { // the time limit applies only until a stream starts
          this.pending.delete(id);
          resolve(err(504, "duoduo did not answer in time; the outcome is unknown"));
        }
      }, TIMEOUT_MS);
      this.pending.set(id, { ws, timer, streaming: false, resolve: (r) => { clearTimeout(timer); resolve(r); } });
    });
    try { ws.send(frame); } catch {
      const p = this.pending.get(id); this.pending.delete(id);
      p?.resolve(err(503, "duoduo host offline; the request did not reach duoduo"));
    }
    return result;
  }
  buildHeaders(msgHeaders) {
    const headers = new Headers();
    for (const h of RES_HEADERS) {
      const v = msgHeaders?.[h] ?? msgHeaders?.[h.toLowerCase()];
      if (typeof v === "string") headers.set(h, v);
    }
    return headers;
  }
  status(msg) {
    return Number.isInteger(msg.status) && msg.status >= 200 && msg.status <= 599 ? msg.status : 502;
  }
  webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_BYTES) return;
    let msg; try { msg = JSON.parse(message); } catch { return; }
    const id = msg?.id;
    if (typeof id !== "string") return;
    const p = this.pending.get(id);
    if (!p || p.ws !== ws) return; // only the socket the request went out on

    if (msg.type === "response") {
      this.pending.delete(id);
      const status = this.status(msg);
      const nullBody = [204, 205, 304].includes(status);
      p.resolve(new Response(nullBody ? null : (msg.body ?? ""), { status, headers: this.buildHeaders(msg.headers) }));
      return;
    }
    if (msg.type === "response-start") {
      clearTimeout(p.timer);
      p.streaming = true;
      const status = this.status(msg);
      const headers = this.buildHeaders(msg.headers);
      const self = this;
      const stream = new ReadableStream({
        start(controller) { p.controller = controller; },
        cancel() { // the client went away: tell the connector to stop
          self.pending.delete(id);
          try { ws.send(JSON.stringify({ type: "cancel", id })); } catch {}
        },
      });
      p.resolve(new Response(stream, { status, headers }));
      return;
    }
    if (msg.type === "response-chunk") {
      if (p.controller && typeof msg.data === "string" && msg.data.length) {
        try { p.controller.enqueue(new TextEncoder().encode(msg.data)); } catch {}
      }
      return;
    }
    if (msg.type === "response-end") {
      this.pending.delete(id);
      try { p.controller?.close(); } catch {}
      return;
    }
  }
  failSocket(ws) {
    for (const [id, p] of this.pending) {
      if (p.ws === ws) {
        this.pending.delete(id);
        clearTimeout(p.timer);
        if (p.controller) { try { p.controller.error(new Error("connector disconnected")); } catch {} }
        else p.resolve(err(503, "duoduo host disconnected; the request did not reach duoduo"));
      }
    }
  }
  webSocketClose(ws) { this.failSocket(ws); }
  webSocketError(ws) { this.failSocket(ws); }
}
