# Cloudflare tunnels: named (R3) and quick (R4)

Reference notes for one way to expose the tether channel. The agent and its owner choose this
option and own it, its security included; it is not an official procedure, and tether supports
no route. Read `SKILL.md` first for its general policy, and `setup.md` for the shared requirements of every
route and the route-neutral sections (grant handover, verification, persistence and
handoff) apply here.

## R3: Cloudflare named tunnel

```bash
cloudflared tunnel login        # prints a URL; hand it to the owner (`setup.md`, Hand a grant to the owner); writes ~/.cloudflared/cert.pem
cloudflared tunnel create duoduo-<host>
cloudflared tunnel route dns duoduo-<host> duoduo-<host>.<domain>
```

`tunnel login` waits for the click: run it in the background and read the URL from its output.
`tunnel create` writes a credentials JSON in `~/.cloudflared/`. It is a secret: never print it,
never move it into a chat. If `~/.cloudflared/config.yml` already exists, it belongs to another
tunnel: do not edit it (`SKILL.md` policy 2); write this tunnel's config to its own file and pass it with
`--config`.

Config:

```yaml
tunnel: <tunnel-id>
credentials-file: <home>/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: duoduo-<host>.<domain>
    service: http://127.0.0.1:<ALADUO_TETHER_PORT>
  - service: http_status:404
```

The last rule answers 404 for every other hostname. It is what keeps "nothing else" true. Check
it with `cloudflared tunnel ingress validate` and
`cloudflared tunnel ingress rule https://other.<domain>` (must match the 404 rule).

## R4: Cloudflare quick tunnel

```bash
cloudflared tunnel --url http://127.0.0.1:<ALADUO_TETHER_PORT>
```

It prints a `https://<random>.trycloudflare.com` URL. No account, no click. The URL changes
whenever cloudflared restarts, and with it every passkey and every connection becomes invalid.
Use it only to test the transport, then move to another route before enrolling a passkey.

## Verify (in addition to setup.md)

- R3: other hostnames on the zone must not reach the channel's port (the 404 rule above).

## Persistence

- R3: `cloudflared service install`. On macOS it installs a user launch agent that reads
  `~/.cloudflared/config.yml`; if this tunnel has its own config file, check
  `cloudflared service install --help` for how to point the service at it. On Linux check the same
  help.
- R4: not made persistent.

## Handoff and rollback

The R3 handoff note lives beside the tunnel's config.

- R3 rollback: `cloudflared service uninstall`, then `cloudflared tunnel delete duoduo-<host>`; the
  owner removes the DNS record in the Cloudflare dashboard.
- Do not touch: other tunnels and their configs, `cert.pem`, the tunnel credentials JSON.

## Grants

Hand each to the owner as `setup.md` (Hand a grant to the owner) says.

| Grant                      | It grants                                                                                  | Verify after                                              |
| -------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `cloudflared tunnel login` | This machine's cloudflared may create tunnels and DNS records in the zone the owner picks. | `~/.cloudflared/cert.pem` exists; the zone is the owner's |

Trust: Cloudflare terminates TLS and sees bearer tokens, authorization codes and enrollment
secrets in transit. Tell the owner before choosing either.

## What is measured

| Fact                                                                                                  | Status     |
| ----------------------------------------------------------------------------------------------------- | ---------- |
| R3 Cloudflare named tunnel, R4 quick tunnel, R6 own gateway, end to end for duoduo                    | Not tested |
| Whether vendor clouds or mainland China networks reach `workers.dev`, `trycloudflare.com` or `ts.net` | Unmeasured |
