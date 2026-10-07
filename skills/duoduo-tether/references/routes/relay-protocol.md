# Relay protocol and connector configuration (R5)

**Not supported.** The code this file describes is a reference implementation of one way to
expose a tether channel, for an owner with no domain and no inbound port. Tether does not ship it, test it, or vouch for it. Whoever
deploys it owns its security: the relay sees every request in transit, bearer tokens,
authorization codes and enrollment secrets included.

## The pieces

The notes for choosing and running this option are in `relay.md`.

| File                         | Runs on                                       | Does                                                                                                                       |
| ---------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `relay/worker/src/worker.js` | Cloudflare Workers, one Durable Object        | Serves the public `https://<worker>.<subdomain>.workers.dev` origin on the tether paths only; holds the connector's socket |
| `relay/worker/wrangler.toml` | `wrangler deploy`                             | The Worker's deployment; the secret is a Worker secret (`RELAY_SECRET`), never in this file                                |
| `relay/connector.mjs`        | The duoduo host, under a supervisor of choice | Keeps one outbound WebSocket to the Worker and forwards each request to `http://127.0.0.1:<ALADUO_TETHER_PORT>`            |

The connector needs Node 22 or later and nothing else: it uses the global `WebSocket` and `fetch`.
It is a long-running process; nothing restarts it unless the host's own supervisor does (launchd,
systemd, a process manager). The tether channel does not know it exists.

What it needs: a Cloudflare account (no domain), the same secret on both sides (the Worker's
`RELAY_SECRET`, the connector's `TETHER_RELAY_SECRET`), and the tether channel listening on its
loopback port. The public URL the channel is configured with
(`ALADUO_TETHER_PUBLIC_URL`) is the Worker's origin.

## Connector configuration

Environment only; the secret never goes on a command line.

| Key                                                          | Default   | Meaning                                                                             |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------- |
| `TETHER_RELAY_URL`                                           | required  | `wss://<worker>.<subdomain>.workers.dev/connect` (plain `ws://` only to loopback)   |
| `TETHER_RELAY_SECRET`                                        | required  | The bearer secret the Worker checks                                                 |
| `TETHER_UPSTREAM`                                            | required  | `http://127.0.0.1:<ALADUO_TETHER_PORT>` (plain `http://` only to loopback)          |
| `TETHER_RELAY_MAX_REQUEST_BYTES`                             | 1 MiB     | Cloudflare's WebSocket message limit; a larger request gets 413 and reaches nothing |
| `TETHER_RELAY_MAX_FRAME_BYTES`                               | 1 MiB     | The same limit per frame back; a larger answer is cut into frames, never refused    |
| `TETHER_RELAY_DISPATCH_TIMEOUT_MS`                           | 25 s      | Until an answer starts, then 504; below the Worker's 30 s                           |
| `TETHER_RELAY_KEEPALIVE_MS`                                  | 30 s      | Ping interval; a ping unanswered when the next is due drops the link                |
| `TETHER_RELAY_BACKOFF_MIN_MS`, `TETHER_RELAY_BACKOFF_MAX_MS` | 1 s, 10 s | Reconnect delay, doubling from the minimum up to the maximum                        |

The Worker fixes two limits in its source: 1 MiB per WebSocket message, and 30 s per request
until an answer starts.

## Frame format

**Connect.** The connector opens `TETHER_RELAY_URL` with `Authorization: Bearer <secret>`,
following no redirect. The relay answers 426 to a non-upgrade request and 401 to a wrong or missing
secret (compared in constant time), keeps one connector (a new one replaces and closes the old), and
answers the text frame `ping` with `pong`.

**Frames.** Text frames, one JSON object each.

```text
relay → connector   {"type":"request","id":"<unique>","method":"GET|POST","path":"/mcp",
                     "query":"?a=b","headers":{...},"body":"<text>"}
connector → relay   {"type":"response","id":"<same>","status":200,"headers":{...},"body":"<text>"}
```

An event stream, or an answer larger than one frame, comes as a stream instead:

```text
connector → relay   {"type":"response-start","id":"<same>","status":200,"headers":{...}}
connector → relay   {"type":"response-chunk","id":"<same>","data":"<text>"}     (zero or more)
connector → relay   {"type":"response-end","id":"<same>"}
relay → connector   {"type":"cancel","id":"<same>"}                             (the client went away)
```

- The relay writes each chunk's `data` in order, unchanged and unbuffered. A chunk may end in the
  middle of a JSON value; only the concatenation is meaningful.
- Requests are multiplexed; answers may arrive in any order. The relay accepts an answer only on the
  socket it sent the request on; when that socket closes, its outstanding requests fail with 503 and
  open streams end.
- The connector forwards every path; enforcing the tether route list is the relay's job. Request
  headers passed: `content-type`, `accept`, `authorization`, `mcp-protocol-version`, `mcp-method`,
  `mcp-name`, `origin`. Response headers passed: `content-type`, `x-accel-buffering`,
  `www-authenticate`, `location`, `cache-control`, `content-security-policy`, `referrer-policy`.
  No cookies either way. No redirect is ever followed: a 3xx and its `Location` go back to the
  browser as returned.
- The connector answers 413 for a request over its request limit, 504 when the channel does not
  answer within the dispatch limit, and 502 when the channel cannot be reached or fails the
  request, each as JSON `{"error":<status>,"message":"…"}`. The relay's own time limit must exceed
  the dispatch limit, and applies only until a stream starts.
- Neither the relay nor the connector logs a header, a body or a query.
