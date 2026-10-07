# Making tether reachable: discovery, route choice, verification

Read this at `SKILL.md` step 1 when the reachability check fails: the channel has no public URL
yet, or the URL does not answer. It takes you from the host's facts to one verified, persistent
public origin. Then go back to `SKILL.md` step 1 to record the URL.

Contents:

- Discovery checklist
- Choose a route (route notes, requirements of every route, routes, situation → route)
- Hand a grant to the owner
- Verify both directions
- Persistence and the route's handoff

## Discovery checklist

Collect every fact before choosing. Record the answers; the handoff note needs them.

| Fact                                             | How to read it                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailscale present, which CLI                     | macOS: the app's CLI is `/Applications/Tailscale.app/Contents/MacOS/Tailscale`; call it by this full path for the existing node. A Homebrew `tailscale` on `PATH` talks to Homebrew's own `tailscaled`, not to the app. Linux: `command -v tailscale`                                                             |
| A standalone `tailscaled` exists or installs     | `command -v tailscaled`. Linux packages ship it. The macOS app does not; Homebrew's `tailscale` formula provides `tailscale` and `tailscaled` (an install: owner approval)                                                                                                                                        |
| What the existing node serves on :443            | `tailscale serve status` and `tailscale funnel status`. Any entry on :443 means :443 is taken                                                                                                                                                                                                                     |
| Shields-up on the existing node                  | `tailscale debug prefs` (field `ShieldsUp`). Funnel refuses to start while it is on                                                                                                                                                                                                                               |
| Funnel available to this node                    | `tailscale funnel status`; if Funnel is off for the node, `tailscale funnel` prints a consent URL instead of serving                                                                                                                                                                                              |
| The tailnet's DERP map                           | Read the policy's `derpMap` (Hand a grant to the owner, below, says how you may read it). `"OmitDefaultRegions": true`, or any custom region in `derpMap.Regions`, rules out R1 and R2. Also run `tailscale netcheck` on the existing node: if its nearest DERP is a custom region, a Funnel node will home there |
| Owner can edit the tailnet policy                | Ask the owner: "Can you edit your tailnet's access policy in the Tailscale admin console?"                                                                                                                                                                                                                        |
| Owner has a domain; a gateway in front           | Ask the owner, in the one-to-one chat: "Do you have a domain? Do you run a web server or reverse proxy (nginx, Caddy, Traefik, an ingress) that already serves HTTPS for it, and can it reach this machine?" A domain decides between R6/R3 and the no-domain routes                                              |
| Owner has a Cloudflare account; the domain on it | Ask the owner. R3 needs the domain on Cloudflare; R5 needs only a free account                                                                                                                                                                                                                                    |
| `cloudflared`, `wrangler` present                | `command -v cloudflared`; `npx wrangler --version`                                                                                                                                                                                                                                                                |
| Loopback listeners on this host                  | macOS `lsof -nP -iTCP -sTCP:LISTEN`; Linux `ss -ltn`. Note every port: the daemon's ports, `ALADUO_REMOTE_PORT` if set, and anything else. These are the negative-test targets                                                                                                                                    |

## Choose a route

Every route below is an option. You and the owner choose it, and its security is the owner's;
tether supports no route. Read `SKILL.md` first for its general policy. Each
has reference notes: the steps that worked, the security facts behind them, its grants, checks,
persistence and rollback, and what was measured. They are not an official procedure; adapt them
to what discovery found. Once a route is chosen, read its file whole before the first step:

- [gateway.md](gateway.md): R6, the owner's own gateway, and its contract.
- [cloudflare-tunnel.md](cloudflare-tunnel.md): R3 named tunnel, R4 quick tunnel.
- [tailscale.md](tailscale.md): R1 Funnel on the existing node, R2 a second
  node with its policy edit and negative tests.
- [relay.md](relay.md): R5, a Cloudflare Worker relay, with its code in the skill's
  `assets/relay/` and the frame format and connector configuration in
  [relay-protocol.md](relay-protocol.md).
- [openai-tunnel.md](openai-tunnel.md): R7, OpenAI's Secure MCP Tunnel.
- [direct.md](direct.md): R8, binding the channel to a fixed IP or a LAN
  address behind a TLS terminator, and when a trusted LAN is acceptable.

### Requirements of every route

Whatever the route, it must:

- serve the public origin over HTTPS on port 443, with a hostname that does not change: grants and
  passkeys are bound to it;
- expose only the channel's paths, and nothing else on the host: `/mcp` GET, POST;
  `/.well-known/oauth-protected-resource` GET; `/.well-known/oauth-authorization-server` GET;
  `/authorize` GET, POST; `/token` POST; `/revoke` POST; `/enroll` GET; `/enroll/options` POST;
  `/enroll/finish` POST (or every path of one hostname that reaches only the channel, which
  answers 404 to the rest);
- pass request and response bodies and headers unchanged: MCP 2026-07-28 clients such as ChatGPT
  fail with -32020 when `Mcp-Method` or `Mcp-Name` is dropped;
- never rewrite `Origin`: the channel refuses `POST /mcp` whose `Origin` is not the public origin;
- never buffer a `text/event-stream` answer, and not cut it off while it stays open (an
  assistant's push subscription, `mail.md`, Listen stream);
- pass a 3xx answer and its `Location` back as returned, never following it: the 302 from
  `/authorize` points at the assistant's own site.

### Routes

| Route                                              | Notes                                     | Preconditions                                                                                                                   | Owner grants                                                            | Internet exposure                                                                                                                                                                     | TLS ends at                           | URL                           |
| -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------- |
| R6. The owner's own front gateway                  | [gateway](gateway.md)                     | A domain, and a gateway the owner runs that terminates TLS for it and can reach this host                                       | A new site on the gateway, a DNS record                                 | The paths the gateway forwards: the channel's list, or the hostname (the channel answers 404 to the rest)                                                                             | The owner's gateway                   | Stable, on the owner's domain |
| R3. Cloudflare named tunnel                        | [cloudflare-tunnel](cloudflare-tunnel.md) | The owner has a domain on Cloudflare                                                                                            | `cloudflared tunnel login`, pick the zone                               | Every path of the channel's port, on one hostname                                                                                                                                     | Cloudflare                            | Stable, on the owner's domain |
| R1. Existing Tailscale node, Funnel on its :443    | [tailscale](tailscale.md)                 | Existing node's :443 serves nothing; shields-up off; no custom DERP regions                                                     | Funnel consent, if Funnel is not yet enabled                            | Every path of the channel's port                                                                                                                                                      | This host                             | Stable, `*.ts.net`            |
| R2. Second Tailscale node, userspace, tagged       | [tailscale](tailscale.md)                 | A standalone `tailscaled` can run; the owner can edit the policy; no custom DERP regions                                        | Policy edit, device login                                               | Every path of the channel's port, plus a tailnet door the policy must shut                                                                                                            | This host                             | Stable, `*.ts.net`            |
| R5. Cloudflare Worker relay (reference code)       | [relay](relay.md)                         | The owner has a Cloudflare account (no domain needed); you deploy the reference Worker and run its connector, or write your own | `wrangler login`, the `workers.dev` subdomain choice                    | Only the allowed paths; no inbound port, no tailnet path                                                                                                                              | Cloudflare                            | Stable, `*.workers.dev`       |
| R7. OpenAI Secure MCP Tunnel (OpenAI clients only) | [openai-tunnel](openai-tunnel.md)         | The assistant is an OpenAI client (ChatGPT developer mode); the owner's Platform organization has tunnel permissions            | Tunnel creation and workspace association, tunnel roles, developer mode | No public endpoint for MCP; OpenAI's `tunnel-client` polls OpenAI outbound. The authorize and enrollment pages still need an origin the owner's browser reaches (open, see its notes) | OpenAI                                | No URL for MCP; a `tunnel_id` |
| R4. Cloudflare quick tunnel                        | [cloudflare-tunnel](cloudflare-tunnel.md) | None                                                                                                                            | None                                                                    | Every path of the channel's port                                                                                                                                                      | Cloudflare                            | Changes on every restart      |
| R8. Direct bind: a fixed IP or the LAN             | [direct](direct.md)                       | A static address; a TLS terminator for the public hostname (this host or a gateway)                                             | Whatever the TLS terminator needs                                       | The bind address on its network (plain HTTP there); the public origin as the terminator serves it                                                                                     | Where the owner's TLS terminator runs | Stable, on the owner's domain |

Facts that hold across routes:

- With a domain, R6 and R3 are the routes. R5 is a convenience for an owner without a domain; it
  is not the recommended route. R4 is for transport tests only. R7 serves only OpenAI clients, so
  any other assistant still needs one of the public routes.
- Trust: on R1 and R2 TLS ends on this host, on R6 at the owner's own gateway. On R3, R4 and R5
  Cloudflare terminates TLS and sees bearer tokens, authorization codes and enrollment secrets in
  transit. Tell the owner this before choosing one of them.
- What you must own: R1 adds nothing; R6 adds a site on the owner's gateway; R3 adds a tunnel; R2
  adds a node and a policy change; R5 adds a Worker and a connector process you keep. R3 and R5 open no inbound
  port and coexist with anything already running.

### Situation → route

| Situation                                                                     | Route                                                                                                                 | Owner grants                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A domain, and a gateway the owner runs already fronts this host               | R6                                                                                                                    | The new site and its DNS record                                    |
| A domain on Cloudflare, no gateway                                            | R3                                                                                                                    | Cloudflare login                                                   |
| A domain elsewhere, no gateway                                                | Ask the owner: set up a gateway (R6), or move the domain's DNS to Cloudflare (R3). Until then, as "no domain"         | As the route                                                       |
| No domain; Tailscale node with a free :443, shields-up off, default DERP      | R1                                                                                                                    | Funnel consent if needed                                           |
| No domain; Tailscale node whose :443 is taken, or shields-up on, default DERP | R2 if the owner can edit the policy; otherwise R5. Do not turn shields-up off (`SKILL.md` policy 2)                   | As the route                                                       |
| No domain; tailnet with `OmitDefaultRegions: true` or any custom DERP region  | R5. Not R1 or R2. Do not change the DERP map (`SKILL.md` policy 2)                                                    | `wrangler login`                                                   |
| No domain, no Tailscale                                                       | R5 (a free Cloudflare account is enough)                                                                              | `wrangler login`                                                   |
| Funnel not enabled for the tailnet                                            | Unchanged                                                                                                             | R1: the consent link. R2: the tag-scoped `nodeAttrs` entry instead |
| Tailnet still on the default allow-all policy                                 | R2 only after the policy edit; it is mandatory                                                                        | The policy edit                                                    |
| The owner wants no public MCP endpoint, and the assistant is ChatGPT          | R7, with its open points (its notes). Get a public route working with ChatGPT's "Server URL" first if one is possible | Tunnel creation, roles, developer mode                             |
| A fixed public IP or direct LAN access, and a TLS terminator the owner runs   | R8; with the terminator on this host, R6 on loopback is the simpler form                                              | As the route                                                       |
| Only testing the transport                                                    | R4, never for assistants                                                                                              | None                                                               |
| A tool would publish anything besides the tether channel                      | Stop (`SKILL.md` policy 1); tell the owner what it would publish                                                      | —                                                                  |

Each route's notes file (the Notes column above) holds its steps, grants, extra checks,
persistence and rollback.

Not the default: routes driven by a Cloudflare API token or a Tailscale auth key or API key. The
first such credential has to be created by a human in a dashboard, and it is itself a secret the
human must hand over. That is more human work, not less.

## Hand a grant to the owner

Only in the owner's one-to-one chat with you, or on the host terminal. Send exactly this shape,
then wait:

```text
Please open this link and approve: <the URL, verbatim>
It grants: <one sentence, below>
Tell me when you are done; I will then check <what you will verify>.
```

- Copy the URL as the tool printed it. Never shorten, wrap or rewrite it.
- One grant per message. Do not continue until the owner confirms, then verify.
- Never ask the owner to send anything back except "done".
- If the owner is logged in to the console in a browser you can operate (Tailscale admin console,
  Cloudflare dashboard, a consent page), you may do the grant there yourself, but only this way:
  show the owner the exact change (the policy diff, or the button and what it grants), and save or
  click only after the owner says yes. Otherwise the owner does it by hand. This never covers the
  enrollment or authorize page (`SKILL.md` policy 4).
- After the owner confirms, check that the result belongs to the owner: the Cloudflare zone or
  account is the one the owner named, or the new device sits in the owner's own tailnet (the
  tailnet name in `tailscale --socket=… status` matches the existing node's). If not, stop and
  tell the owner.

Each route's notes list its grants, what each grants, and what to verify after it.

## Verify both directions

The channel serves these routes only once `ALADUO_TETHER_PUBLIC_URL` is set (`SKILL.md` step 1). Use
the public name as an outsider would resolve it. A host inside the tailnet may resolve a
`*.ts.net` name to a tailnet address, or not at all when the policy hides the node (R2). Take the
public address from a public resolver and pin it:

```bash
IP=$(dig +short <host name> @1.1.1.1 | tail -n1)
R="--resolve <host name>:443:$IP"      # tailnet routes; leave R empty on the other routes
```

Positive:

```bash
curl -sS $R -o /dev/null -w '%{http_code}\n' -X POST 'https://<host name>/mcp'        # 401
curl -sS $R -D - -o /dev/null -X POST 'https://<host name>/mcp' | grep -i '^www-authenticate'
#   Bearer resource_metadata="https://<host name>/.well-known/oauth-protected-resource", …
curl -sS $R -o /dev/null -w '%{http_code}\n' 'https://<host name>/mcp'                # 405
curl -sS $R 'https://<host name>/.well-known/oauth-protected-resource'                # JSON
curl -sS $R 'https://<host name>/.well-known/oauth-authorization-server'              # JSON
```

The metadata's `resource` and `issuer` must equal `https://<host name>` exactly. Anything else
(a loopback address, a port, the Worker's connect URL) means `ALADUO_TETHER_PUBLIC_URL` is wrong.

Negative:

- Nothing else on the host answers through the new path: test from where an attacker would stand
  (the internet, and a tailnet device for a tailnet route).
- The route's own checks, in its notes file.
- The redirect check, with the owner on the first connect (`SKILL.md` step 4): after the owner
  approves with the passkey, the browser must land on the client's redirect URI with a `code` and
  the app must finish connecting, not stop on an error page of whatever sits in between. Deny
  cannot run this check: it follows no address and the app is not told (`SKILL.md` step 4).

If any check fails, take the new path down and tell the owner before anything else.

## Persistence and the route's handoff

The route survives a reboot: each route's notes say what keeps it running. Then write a short
handoff note next to the route's state (its notes say where). No credentials in it. Record:

- Purpose: the public URL for duoduo's connected assistants, the URL itself, and
  `ALADUO_TETHER_PORT`.
- The discovery answers, the route, and why it was chosen.
- Versions, service label, state and log paths, what the route's notes add, and which files hold
  secrets (by path, never the value).
- Start, stop, verify (Verify both directions, above, and the route's own checks), and rollback (the route's notes).
- Do not touch: everything that existed before (`SKILL.md` policy 2), and every credential file.
