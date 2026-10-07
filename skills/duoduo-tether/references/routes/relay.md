# A Cloudflare Worker relay (R5)

Route notes. Read `setup.md` first: what these notes are, the requirements every route meets, and
the route-neutral sections (grant handover, verification, persistence and handoff) that apply here.
The code this option runs (`assets/relay/`) is a reference implementation that is not supported:
tether does not ship it, test it, or vouch for it, and whoever deploys it owns its security.

Contents:

- How it works
- Requirements
- Steps
- Verify (in addition to setup.md)
- Persistence
- Handoff and rollback
- Grants
- What is measured

## How it works

A Cloudflare Worker answers on `https://<worker>.<subdomain>.workers.dev`. A connector process on
this host keeps one outbound WebSocket to it. The Worker turns each public request on an allowed
path into a frame on that socket; the connector forwards it over HTTP to the tether channel on
`http://127.0.0.1:<ALADUO_TETHER_PORT>` and sends the answer back as frames. No domain, no inbound
port, no tailnet change. R5 is a convenience for an owner without a domain; with a domain, R6 or R3
fit better.

The reference code is under the skill's `assets/relay/` (paths from the skill's root):

| Path                                | What it is                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `assets/relay/worker/src/worker.js` | The Worker, with one Durable Object holding the connector's socket              |
| `assets/relay/worker/wrangler.toml` | Its deployment; the secret is a Worker secret, never in this file               |
| `assets/relay/connector.mjs`        | The connector: Node 22 or later, no dependencies                                |
| `relay-protocol.md`                 | The connector's configuration and the frame format between Worker and connector |

Use the reference code, or write your own Worker or connector from the requirements below and the
frame format in `relay-protocol.md`. Copy what you deploy into a directory of its own on this host
(for example `~/.local/share/duoduo-relay/`), so a skill update never changes running code, and
record that directory in the handoff. Holding one WebSocket across requests needs a Durable
Object on Cloudflare; one Durable Object ran on the free plan in the field build.

The tether channel does not know the relay exists: it sees ordinary HTTP on its loopback port.
`duoduo channel tether status` shows nothing about the relay; the connector's own log does.

## Requirements

**Connect endpoint.** One path of your choice outside the public list (for example `/connect`),
used only by the connector. It is the one non-public path the Worker serves. The connector's
`TETHER_RELAY_URL` is this endpoint's full URL: `wss://<worker>.<subdomain>.workers.dev/<connect path>`
(`relay-protocol.md`, Connector configuration). The Worker must:

- answer 426 to a request that is not a WebSocket upgrade;
- answer 401 to a wrong or missing secret, comparing in constant time;
- keep one connector: a newly authenticated connection replaces the old one, and the old one is
  closed;
- answer the text frame `ping` with the text frame `pong` (the connector's keepalive; without
  the `pong` the connector drops the link and reconnects).

**Frames.** As `relay-protocol.md` specifies, streams included: a `text/event-stream` answer
(`mail.md`, Listen stream) and any answer larger than one frame.

**What passes.** Everything not listed here, except the connect endpoint, is refused by the relay
with 404.

| Item              | Rule                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paths and methods | The list in `setup.md`, Requirements of every route. Exact paths only                                                                                                                                                                                                                                                                                                                                     |
| Query             | Passed unchanged                                                                                                                                                                                                                                                                                                                                                                                          |
| Request headers   | An allow-list: `relay-protocol.md`, Frame format, and the code in `assets/relay/`. Never `host`, never `cookie`                                                                                                                                                                                                                                                                                           |
| Response headers  | An allow-list: `relay-protocol.md`, Frame format, and the code in `assets/relay/`                                                                                                                                                                                                                                                                                                                         |
| Cookies           | None, in either direction. No route sets or reads one                                                                                                                                                                                                                                                                                                                                                     |
| Redirects         | Never followed, anywhere in the relay. Every fetch that carries a tether-channel response sets `redirect: "manual"`: the Worker-to-Durable-Object hop and any internal subrequest included. A Workers `fetch` follows redirects by default, so a missing setting makes the Worker chase the 302 from `POST /authorize` to the assistant's site and fail (Cloudflare error 1101, "Worker threw exception") |

**Errors the relay returns itself.** Each response body is short JSON saying what happened and
that the request did not reach duoduo (for 504: that the outcome is unknown).

| Status | When                                                  |
| ------ | ----------------------------------------------------- |
| 503    | No connector is connected: the duoduo host is offline |
| 504    | No response within the relay's time limit             |
| 413    | The request body is over the relay's size limit       |

The connector answers 413, 504 and 502 itself (`relay-protocol.md`); the Worker returns those
unchanged.

**Limits.** The Worker enforces two limits. A per-request time limit, answering 504 after it: it
must exceed the connector's dispatch limit (`TETHER_RELAY_DISPATCH_TIMEOUT_MS`, default 25 s), or
the relay answers 504 before the connector does; the reference Worker uses 30 s. A size limit of
1 MiB for one WebSocket message in either direction, answering 413 for a larger request: 1 MiB is
Cloudflare's WebSocket message limit. The connector cuts every chunk to fit
`TETHER_RELAY_MAX_FRAME_BYTES` (default 1 MiB), so keep the Worker's message limit at or above
it. For a stream, the time limit applies only until `response-start`; after it the stream lives
until the client, the channel or the socket ends it. An answer or a stream as a whole has no size
limit.

**Logging.** Neither the Worker nor the connector logs a header, a body or a query. Bearer tokens,
authorization codes and enrollment secrets pass through both.

**Secret.** Whoever holds the relay secret can become the connector and receive every bearer
token sent to the public URL. It lives only in the Worker's secret store and in the connector's
environment file (mode 0600, read by its supervisor). It never appears in a chat, a session's
output, a log, a command line, a plist or a unit file. Step 4 below generates it and writes it
from file to file without printing it; never show the file's content on a terminal.

## Steps

1. Ask the owner for a Cloudflare account, and for the `workers.dev` subdomain and Worker name.
   The subdomain belongs to the whole account and becomes part of the passkey's hostname, so it
   must be chosen once. If the account has no subdomain yet, a non-interactive `wrangler deploy`
   registers the Worker's name as the subdomain (giving `<name>.<name>.workers.dev`): have the
   owner choose or confirm the subdomain before the first deploy.
2. Copy the code into the deployment directory, or write your own from the requirements. The
   skill's directory is the one holding `SKILL.md` (`~/.agents/skills/duoduo-tether/` or
   `~/.claude/skills/…`). Then set the Worker name in `$D/worker/wrangler.toml`.

   ```bash
   D="$HOME/.local/share/duoduo-relay"
   mkdir -p "$D" && chmod 700 "$D"
   cp -R <skill dir>/assets/relay/worker <skill dir>/assets/relay/connector.mjs "$D/"
   ```

3. `npx wrangler login` prints a consent URL: a grant (`setup.md`, Hand a grant to the owner).
4. Deploy, then create the secret in both places without printing it. The secret goes from
   `openssl` into a 0600 file and, through `tee`, straight into `wrangler secret put` on stdin;
   the connector's environment file is written from that file, which is then removed.

   ```bash
   ( cd "$D/worker" && npx wrangler deploy )
   ( umask 077
     openssl rand -hex 32 | tr -d '\n' | tee "$D/relay.secret" \
       | ( cd "$D/worker" && npx wrangler secret put RELAY_SECRET )
     { printf 'TETHER_RELAY_SECRET='; cat "$D/relay.secret"; echo; } > "$D/connector.env" )
   rm "$D/relay.secret"
   grep -o '^[A-Z_]*=' "$D/connector.env"   # names only
   ```

   The deploy prints the Worker's URL, `https://<worker>.<subdomain>.workers.dev`. Until the secret
   is set, the Worker refuses every connector with 401.

5. Make sure the channel listens: `ALADUO_TETHER_PORT` is set in `~/.config/duoduo/.env` and
   `duoduo channel tether status` shows `Listening 127.0.0.1:<port>`.
6. Add the rest of the connector's environment. Leave the limits at their defaults unless the
   owner asks.

   ```bash
   ( umask 077
     printf 'TETHER_RELAY_URL=wss://%s/connect\n' <worker>.<subdomain>.workers.dev >> "$D/connector.env"
     printf 'TETHER_UPSTREAM=http://127.0.0.1:%s\n' <ALADUO_TETHER_PORT> >> "$D/connector.env" )
   ```

7. Run the connector under a supervisor (Persistence, below). Its log says `relay connected`;
   `relay disconnected (code 1006)` repeating means the Worker refused the upgrade (a wrong secret
   or URL) or is unreachable: fix that first.
8. Write `ALADUO_TETHER_PUBLIC_URL=https://<worker>.<subdomain>.workers.dev` and verify
   (`SKILL.md` step 1, which runs the checks in `setup.md`).

## Verify (in addition to setup.md)

- Any path outside the list (`/`, `/rpc`, `/admin`) answers 404 from the relay. The connect path
  answers 426 to a plain request and 401 to an upgrade with a wrong bearer.
- Stop the connector: a metadata request must answer 503 at once, saying the host is offline.
  Start it again; the next request succeeds without a new approval.
- Watch `npx wrangler tail` during a request with a dummy bearer: no header, body or query may
  appear.
- The redirect check (`setup.md`, Verify both directions).

## Persistence

The Worker stays deployed on Cloudflare. The connector is a long-running process that nothing
restarts unless the host's supervisor does; the tether channel does not start it. Which
supervisor runs it is the host's choice; the owner may have one already.

| Option                                                     | Restarts on exit | Starts at boot or login                                     | Notes                                                                     |
| ---------------------------------------------------------- | ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| launchd user agent (macOS)                                 | Yes              | At login                                                    | Native, nothing to install. The default on macOS                          |
| systemd user unit (Linux)                                  | Yes              | At login; at boot with lingering (`loginctl enable-linger`) | Native. The default on Linux                                              |
| A process manager the host already runs (pm2, supervisord) | Yes              | As configured                                               | Only if it is already there; installing one adds a dependency to maintain |
| `nohup` in the background                                  | No               | No                                                          | For a test only: the next crash or reboot takes every assistant offline   |

Whatever runs it, the secret stays in the 0600 environment file, never in a plist, unit file or
command line, and the node path is absolute: a supervisor's `PATH` is not the shell's. A path
inside a version manager (nvm, fnm) changes when that node is upgraded or removed; prefer a system
or Homebrew node, or record in the handoff that a node upgrade needs the supervisor's file updated.

**launchd.** This writes the plist with the real paths filled in, then loads it:

```bash
: "${D:?set D first}"
NODE="$(command -v node)"; L=ai.openduo.tether-relay; F="$HOME/Library/LaunchAgents/$L.plist"
cat > "$F" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$L</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>set -a; . "$D/connector.env"; set +a; exec "$NODE" "$D/connector.mjs"</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardErrorPath</key><string>$D/connector.log</string>
  <key>StandardOutPath</key><string>$D/connector.log</string>
</dict>
</plist>
EOF
plutil -lint "$F"
launchctl bootout gui/$(id -u)/$L 2>/dev/null   # only if an earlier copy is loaded
launchctl bootstrap gui/$(id -u) "$F"
launchctl print gui/$(id -u)/$L | grep -E '^\s*(state|pid) ='
tail -n 5 "$D/connector.log"
```

**systemd.**

```bash
: "${D:?set D first}"
NODE="$(command -v node)"; mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/tether-relay.service <<EOF
[Unit]
Description=tether relay connector (reference implementation)
After=network-online.target

[Service]
EnvironmentFile=$D/connector.env
ExecStart=$NODE $D/connector.mjs
Restart=always

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload && systemctl --user enable --now tether-relay
journalctl --user -u tether-relay -n 5
```

## Handoff and rollback

The handoff note lives in the deployment directory. Beyond what `setup.md` (Persistence) lists, record
the Worker name, account and subdomain, the connector's service label and log path, and the
environment file's path (never its content).

- Rollback: stop and remove the connector's service, then `npx wrangler delete` in `worker/`, then
  remove the deployment directory. The channel keeps listening on loopback; unset
  `ALADUO_TETHER_PUBLIC_URL` if no other route replaces this one.
- The relay secret may have leaked: generate a new one into both places as above, redeploy if
  needed, and restart the connector.
- Do not touch: other Workers, other launch agents or units.

## Grants

Hand each to the owner as `setup.md` (Hand a grant to the owner) says.

| Grant                   | It grants                                                                                            | Verify after                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `wrangler login`        | This machine's wrangler may deploy Workers and set Worker secrets in the owner's Cloudflare account. | `npx wrangler whoami` names the owner's account        |
| `workers.dev` subdomain | The account's Worker hostnames end in `<subdomain>.workers.dev`, for every Worker in the account.    | The deployed URL carries the subdomain the owner chose |

Trust: Cloudflare terminates TLS (`setup.md`, Choose a route); tell the owner before choosing this
option.

## What is measured

| Fact                                                                                                        | Status                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A relay reachable from the internet; immediate 503 when the host is offline                                 | Measured from the public internet. The path list, frames and headers above are measured on a macOS host with ChatGPT, Cursor/Grok and a self-built agent connected through a relay |
| A 2026-07-28 client (ChatGPT) through a relay that drops `Mcp-Method` / `Mcp-Name`                          | Measured: every call fails with -32020 at `server/discover`; passing both headers fixed it                                                                                         |
| `wrangler deploy` in CI mode registers the Worker name as the account's `workers.dev` subdomain             | Measured                                                                                                                                                                           |
| The standalone `connector.mjs`: OAuth, an MCP call, a streamed listen, an answer cut into frames, reconnect | Measured against a local test relay and a real tether channel, under Node 22 and Node 26. Not yet measured behind a deployed Worker                                                |
| Whether vendor clouds or mainland China networks reach `workers.dev`                                        | Unmeasured                                                                                                                                                                         |
