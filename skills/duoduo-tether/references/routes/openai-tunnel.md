# OpenAI Secure MCP Tunnel (R7, OpenAI clients only)

Reference notes for one way to expose the tether channel. The agent and its owner choose this
option and own it, its security included; it is not an official procedure, and tether supports
no route. Read `SKILL.md` first for its general policy, and `setup.md` for the shared requirements of every
route and the route-neutral sections (grant handover, verification, persistence and
handoff) apply here.

## R7: OpenAI Secure MCP Tunnel (OpenAI clients only)

OpenAI's Secure MCP Tunnel connects a private MCP server to OpenAI products without an inbound
port. OpenAI's `tunnel-client` runs on this host, polls OpenAI over outbound HTTPS
(`api.openai.com:443`, or `mtls.api.openai.com:443` with control-plane mTLS), forwards each MCP
request to the local server, and returns the answer through the same tunnel. It is not a
Cloudflare Tunnel. Source: OpenAI's guide "Secure MCP Tunnel" on developers.openai.com; read its
current version before acting.

When to use it: the owner wants no public MCP endpoint, and the assistant is an OpenAI client.

What it covers and what it does not:

- It serves OpenAI surfaces only. OpenAI names ChatGPT in developer mode, Codex and the Responses
  API. Any other assistant still needs one of the public routes.
- OpenAI states it supports private connections, including developer-mode testing, and not public
  plugin submission or distribution.
- It solves network reachability only. The tether channel's OAuth and the owner's passkey approval
  still apply to every connection.
- When `tunnel-client` is not connected, requests through the tunnel fail until it reconnects.
- OpenAI carries the requests: it sees what the assistant sends and receives, as it already does as
  the client.

Open, unmeasured. Measure them before relying on R7, and do not design around them:

- **Whether ChatGPT's OAuth discovery and authorize flow work over the tunnel for duoduo.**
  OpenAI states that OAuth discovery can travel through the tunnel, but that the authorization
  server itself is not tunneled: if it is unreachable from the public internet and from the
  `tunnel-client` host, the OAuth flow can fail even when the MCP server is reachable. For duoduo
  the tether channel is its own authorization server.
- **How the owner's browser reaches the authorize page and the enrollment page.** The issuer,
  the OAuth resource and the passkey's relying party all derive from `ALADUO_TETHER_PUBLIC_URL`, so both
  pages must open in the owner's browser at exactly that origin. If the tunnel cannot serve them,
  R7 still needs a public or tailnet-reachable origin for those pages. This is open.
- Whether `tunnel-client` accepts a plain `http://127.0.0.1` server URL. OpenAI's example uses
  an `https://` URL.

### Steps

`tunnel-client` is OpenAI's software. The host runs and owns it; this skill gives steps, not
configuration.

1. The owner creates a tunnel in the OpenAI Platform's tunnel settings, associates it with the
   ChatGPT workspace that will use it, and gives you the `tunnel_id` (an identifier, not a
   secret). Grants: `setup.md`, Hand a grant to the owner.
2. Check the permissions with the owner. In the Platform organization, Read and Manage create or
   edit tunnels; Read and Use run `tunnel-client` or select a tunnel. An organization owner or
   RBAC administrator grants these roles, and a new assignment can take up to 30 minutes to
   propagate. ChatGPT developer mode is a separate workspace permission. Seeing the Tunnels option
   does not mean the permissions are complete.
3. Download `tunnel-client` from OpenAI's `openai/tunnel-client` releases or the Platform's
   tunnel settings (an install: owner approval). Read `tunnel-client help quickstart`.
4. Configure it with `tunnel-client init`: the `tunnel_id`, and the local MCP server as a URL,
   `http://127.0.0.1:<ALADUO_TETHER_PORT>/mcp`. The runtime API key goes in the
   `CONTROL_PLANE_API_KEY` environment variable on the host only. The owner sets it in a terminal
   or a 0600 environment file; it never passes through a chat, and you never print it.
5. `tunnel-client doctor`, then `tunnel-client run`. Keep it running as a service (`setup.md`, Persistence).
   Its health routes, metrics and admin UI listen on loopback; keep them there (`SKILL.md` policy 1).
6. The owner connects ChatGPT with "Tunnel" (`SKILL.md` step 3).

## Verify (in addition to setup.md)

- `tunnel-client doctor` passes, and ChatGPT lists the server's tools over "Tunnel".
- The open points above are measured, not assumed, and the authorize and enrollment pages must
  answer at `ALADUO_TETHER_PUBLIC_URL` in the owner's browser.

## Persistence, handoff and rollback

- Run `tunnel-client run` under a supervisor that restarts it on exit: a user LaunchAgent on macOS
  (`RunAtLoad`, `KeepAlive`), a systemd unit with `Restart=always` on Linux. The API key comes from
  a 0600 environment file, never from the plist or unit text.
- The handoff note lives beside the `tunnel-client` configuration, with the `tunnel_id` and never
  the API key.
- Rollback: stop and remove the service; the owner deletes the tunnel in the Platform's tunnel
  settings and removes the ChatGPT app.
- If `tunnel-client` stops, ChatGPT's calls fail until it reconnects. Restart the service; no new
  approval.

## Grants

Hand each to the owner as `setup.md` (Hand a grant to the owner) says.

| Grant              | It grants                                                                                                     | Verify after                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R7 tunnel creation | A tunnel in the owner's OpenAI Platform organization, associated with the ChatGPT workspace that will use it. | The owner gives the `tunnel_id`; `tunnel-client doctor` passes    |
| R7 tunnel roles    | The Read and Use role (to run the client) and developer mode in the ChatGPT workspace.                        | `tunnel-client doctor` passes; the Tunnel option lists the tunnel |

## What is measured

| Fact                                                                                                                                          | Status                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| R7 OpenAI Secure MCP Tunnel for duoduo: tools, OAuth discovery and authorize, the owner's browser reaching the authorize and enrollment pages | Unmeasured. OpenAI documents that discovery can cross the tunnel and that the authorization server is not tunneled |
