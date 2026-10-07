# The owner's own front gateway (R6)

Reference notes for one way to expose the tether channel. The agent and its owner choose this
option and own it, its security included; it is not an official procedure, and tether supports
no route. Read `SKILL.md` first for its general policy, and `setup.md` for the shared requirements of every
route and the route-neutral sections (grant handover, verification, persistence and
handoff) apply here.

## R6: the owner's own front gateway

The owner already runs a web server or reverse proxy (nginx, Caddy, Traefik, an ingress) that
terminates TLS on 443 for their domain. A new hostname on it forwards to the tether channel. The
gateway's configuration belongs to the owner: write the new site in the gateway's own terms,
following the contract below. This skill gives no configuration for any product.

### Contract

| Item             | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hostname and TLS | One hostname of its own, served on 443 with a valid certificate. `https://<hostname>` equals `ALADUO_TETHER_PUBLIC_URL` exactly: the OAuth issuer, the OAuth resource and the passkey's relying party all derive from it, so a later hostname change voids every passkey and every connection                                                                                                                                       |
| Mount point      | The hostname's root. No path prefix: the channel serves its metadata at `/.well-known/…` and every route at a fixed path                                                                                                                                                                                                                                                                                                            |
| Upstream         | `http://127.0.0.1:<ALADUO_TETHER_PORT>`. The channel listens on loopback unless `ALADUO_TETHER_HOST` says otherwise. A gateway on another machine needs a private link to this host (R8, `direct.md`); never bind a daemon port to a network interface                                                                                                                                                                              |
| Paths            | Either exactly these: `/mcp` GET, POST; `/.well-known/oauth-protected-resource` GET; `/.well-known/oauth-authorization-server` GET; `/authorize` GET, POST; `/token` POST; `/revoke` POST; `/enroll` GET; `/enroll/options` POST; `/enroll/finish` POST. Or everything under the hostname: the channel has no other route and answers 404                                                                                           |
| Request          | Pass `Authorization`, `Content-Type`, `Accept`, `Mcp-Protocol-Version`, `Mcp-Method`, `Mcp-Name` and `Origin` unchanged (MCP 2026-07-28 clients such as ChatGPT fail with -32020 without `Mcp-Method` / `Mcp-Name`), and every connected assistant unchanged (JSON and `application/x-www-form-urlencoded`). The channel refuses `POST /mcp` whose `Origin` is not the public origin, so never rewrite `Origin`                     |
| Response         | Pass the status and `WWW-Authenticate`, `Location`, `Cache-Control`, `Content-Security-Policy`, `Referrer-Policy`, `X-Accel-Buffering` unchanged. Follow no redirect anywhere between the channel and the browser (the gateway, any hop or subrequest behind it) and rewrite no `Location`: the 302 from `/authorize` points at the assistant's own site and must reach the browser as sent                                         |
| Caching          | None on these routes, `/token` and `/authorize` above all. Add no cache layer and do not override the channel's `Cache-Control`                                                                                                                                                                                                                                                                                                     |
| Size and time    | The gateway's request size limit is not below `ALADUO_TETHER_REQUEST_LIMIT_BYTES`. One response is a stream: a `text/event-stream` answer on `POST /mcp` (an assistant's push subscription, `mail-and-doorbells.md`) stays open for as long as the assistant listens. Do not buffer it, do not cut it at the upstream timeout, and close the upstream request when the client goes away. Every other response is plain JSON or HTML |
| Nothing else     | The new hostname reaches only the tether channel. No daemon port, no other upstream, no admin page. Other sites on the gateway stay as they are (`SKILL.md` policy 2)                                                                                                                                                                                                                                                               |
| Nothing in front | No authentication layer on the hostname (basic auth, single sign-on, forward-auth, an access gateway): it takes over `Authorization` or redirects to its own login, and the assistant's OAuth breaks                                                                                                                                                                                                                                |

Defaults that commonly break the contract (check the gateway's current documentation):

- A proxy rule that mounts the upstream under a path, or appends a path to it, moves the routes
  off the root. Mount at `/` with no path rewrite.
- A request body size limit in the gateway or an ingress controller (nginx's `client_max_body_size`, an
  ingress `proxy-body-size` annotation) must follow `ALADUO_TETHER_REQUEST_LIMIT_BYTES` when the
  owner raises it.
- A response cache or a CDN cache rule on the hostname caches `/token` or `/authorize`; exclude
  the hostname.
- An authentication middleware shared across sites (Traefik middlewares, an ingress auth
  annotation, Cloudflare Access) must not apply to this hostname.

### Steps

1. With the owner: the hostname, and whether the gateway runs on this host or reaches it over a
   private link.
2. Back up the gateway's configuration before adding anything. Add one new site; edit no
   existing one.
3. Validate the configuration with the gateway's own check, show the owner the new site, and
   reload only after the owner says yes.
4. The DNS record for the hostname points at the gateway: the owner adds it, or you do it in the
   owner's browser (`setup.md`, Hand a grant to the owner).
5. Write the URL and verify (`SKILL.md` step 1, which runs the checks in `setup.md`).

## Verify (in addition to setup.md)

- A path outside the list answers 404 (from the gateway or the channel). The gateway's other
  sites answer as before. `/authorize` with a valid client answers its page or an error page; a
  302 it sends keeps its `Location` unchanged.
- Redirect check, done with the owner on the first connect (`SKILL.md` step 4): after the
  owner approves with the passkey, the browser must land on the client's redirect URI with a
  `code` and the app must finish connecting, not stop on an error page of the gateway. Deny
  cannot run this check: it answers a "Connection denied" page from the channel, follows no
  address, and the app is not told.

## Persistence, handoff and rollback

- The gateway is the owner's running service; the new site persists with its configuration.
- The handoff note lives beside the gateway configuration backup.
- Rollback: remove the new site, validate, reload; the owner removes the DNS record.
- Do not touch: the gateway's other sites and their configuration.

## Grants

Hand each to the owner as `setup.md` (Hand a grant to the owner) says.

| Grant           | It grants                                                                                                  | Verify after                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| R6 gateway site | A new site on the owner's gateway that serves the new hostname and forwards it to the tether channel only. | The gateway's own config check passes; other sites answer as before |
| R6 DNS record   | The new hostname resolves to the owner's gateway.                                                          | `dig +short <hostname> @1.1.1.1` returns the gateway's address      |

## What is measured

| Fact                                                                               | Status     |
| ---------------------------------------------------------------------------------- | ---------- |
| R3 Cloudflare named tunnel, R4 quick tunnel, R6 own gateway, end to end for duoduo | Not tested |
