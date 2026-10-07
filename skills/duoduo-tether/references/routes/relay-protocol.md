# Relay protocol and connector configuration (R5)

The frame format and the connector's configuration for R5. The pieces, their support status, the
Worker's requirements and how to run them are in `relay.md`; read it first.

## What it needs

A Cloudflare account (no domain), the same secret on both sides (the Worker's
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

## Frame format

**Connect.** The connector opens `TETHER_RELAY_URL` with `Authorization: Bearer <secret>`,
following no redirect. What the relay answers: `relay.md`, Requirements, Connect endpoint.

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
- The connector forwards every path; the route list is the relay's rule (`relay.md`, Requirements,
  What passes). Request headers passed: `content-type`, `accept`, `authorization`,
  `mcp-protocol-version`, `mcp-method`, `mcp-name`, `origin`. Response headers passed:
  `content-type`, `x-accel-buffering`, `www-authenticate`, `location`, `cache-control`,
  `content-security-policy`, `referrer-policy`. No cookies either way, and no redirect is followed.
- The connector answers 413 for a request over its request limit, 504 when the channel does not
  answer within the dispatch limit, and 502 when the channel cannot be reached or fails the
  request, each as JSON `{"error":<status>,"message":"…"}`. Time and size limits on the relay's
  side: `relay.md`, Requirements, Limits. Logging: `relay.md`, Requirements, Logging.
