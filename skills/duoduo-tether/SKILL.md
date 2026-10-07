---
name: duoduo-tether
description: "Connect one of the owner's other AI assistants (ChatGPT or Dots, Grok Bot, Claude, Cursor, a self-built agent) to duoduo through the tether channel, an MCP server on this host behind OAuth and passkey approval. Use when the owner wants to connect an assistant: make this host reachable if needed (gateway, tunnel, Funnel, fixed IP, Worker relay), enroll the passkey, guide the owner's clicks and approval, hand the assistant its wake-up prompt, and prove an unprompted wake. Also for revoking connections, mail and doorbells. Triggers: 接入 Dots / Grok, 让 ChatGPT 连上多多, MCP 连接, tether, passkey, 给多多一个公网地址."
---

# Duoduo Tether

The owner says "connect Dots" (or Grok Bot, or a self-built agent). You drive it from start to
finish: the assistant ends up connected to `https://<host name>/mcp`, woken by duoduo's mail, and
proven by a test mail it answered on its own. The owner only grants consents, clicks in the
client, approves with the passkey and pastes one prompt.

## General policy

Follow these throughout. Each rule carries its reason.

1. **Publish only the tether channel.** Whatever makes this host reachable exposes the channel's
   address and nothing else: never the daemon's own ports, never its remote listener
   (`ALADUO_REMOTE_PORT`). Reason: a connected assistant's token opens the tether channel only;
   any other open port is an unguarded door.
2. **Never change something that already exists to make room**: another service's serve route, an
   existing tunnel or Worker, a Tailscale node's settings, a firewall, the tailnet policy. Adding is
   allowed; moving, replacing or deleting is not. If the only way needs a change, stop and give the
   owner the options. Reason: those belong to work you cannot see.
3. **Discover, then let the owner grant; you do the work.** Read every fact you can before
   deciding. Each grant (a consent link, a login, a policy edit) goes to the owner one at a time, in
   the owner's one-to-one chat or on the host terminal (`routes/setup.md`, Hand a grant to the
   owner). The owner never handles a token, key or credential file in a chat. Reason: grants need
   the owner's account, and credentials in a chat leak.
4. **Only the owner's passkey approves.** Approving happens only on the channel's authorize page,
   with the owner's passkey. No channel, message, command or agent can approve, you included. Never
   open or operate the enrollment or authorize page yourself. Reason: every reply you write lands in
   duoduo's event log, which every connected assistant reads; a passkey assertion needs the owner's
   authenticator, and no text can produce one.
5. **Zero configuration, smallest open surface.** The channel needs nothing configured per
   assistant and serves nothing beyond its fixed routes. Each client situation maps to a channel
   verb you run yourself plus a playbook row. Never answer a new client with a per-host workaround
   (a static route, a document served from a Worker or gateway) or a new `.env` setting; a situation
   the playbooks do not cover goes to the owner. Reason: every public addition is a door someone
   must keep shut, and a fix one host invents is a fix no other host has.
6. **Prove it, hand it over, say what is proven.** A step is done when its check passed. The setup
   survives a reboot and is written down (step 7). For each fact you rely on, say whether it is
   verified in source, measured on a host, or unmeasured (`operations.md`, What is measured).
   Reason: the owner decides on risk.

Each install, `.env` edit and restart needs the owner's approval. Never print a token or secret.

## Connect an assistant, start to finish

### 0. Which client? Pick its playbook

| The owner's assistant                                 | Playbook                                                             | Wake                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| ChatGPT, including OpenAI's Dots                      | [references/clients/chatgpt.md](references/clients/chatgpt.md)       | MCP Events automation, set up by the assistant       |
| Grok Bot                                              | [references/clients/grokbot.md](references/clients/grokbot.md)       | Webhook-triggered routine, registered as a doorbell  |
| An agent running its own MCP SDK client, such as Muse | [references/clients/sdk-listen.md](references/clients/sdk-listen.md) | `subscriptions/listen` process, its exit is the wake |
| Claude, Cursor, another or unknown client             | [references/clients/generic.md](references/clients/generic.md)       | Chosen by what the client can do; possibly none      |

Read the playbook whole now. Agree a connection name with the owner (lowercase, for example
`dots`); it names the assistant's address `tether:<name>` everywhere after.

### 1. Is tether already reachable?

```bash
duoduo channel tether status
grep -E '^(ALADUO_TETHER_PORT|ALADUO_TETHER_HOST|ALADUO_TETHER_PUBLIC_URL)=' ~/.config/duoduo/.env
```

- **Not installed** (`duoduo channel tether` is unknown): `duoduo channel install
@openduo/channel-tether`. The flow needs a channel with the `passkey` verb; if
  `duoduo channel tether passkey list` is an unknown verb, stop and tell the owner. Pick a free
  port, add `ALADUO_TETHER_PORT=<port>` to `.env` (the channel refuses to start without it), and
  `duoduo channel tether start`. It binds `127.0.0.1` unless `ALADUO_TETHER_HOST` names another IP
  (R8); it serves plain HTTP either way. Installing and starting it is the opt-in;
  `duoduo channel tether stop` closes it. Until a public URL is set it serves no route (`status`
  says `Public URL not set`, and a local request answers 404).
- **Public URL set**: run the check below. If it passes, go to step 2.
- **No public URL, or the check fails**: read [references/routes/setup.md](references/routes/setup.md)
  and follow it: discovery, route choice, the route's notes, verification, persistence. The route
  notes are [gateway](references/routes/gateway.md) (R6),
  [cloudflare-tunnel](references/routes/cloudflare-tunnel.md) (R3, R4),
  [tailscale](references/routes/tailscale.md) (R1, R2), [relay](references/routes/relay.md) (R5, with
  [relay-protocol](references/routes/relay-protocol.md) and the reference code in
  `references/routes/relay/`), [openai-tunnel](references/routes/openai-tunnel.md) (R7) and
  [direct](references/routes/direct.md) (R8). Then record the URL: write the origin, no path, as
  `ALADUO_TETHER_PUBLIC_URL=https://<host name>` in `~/.config/duoduo/.env`, then
  `duoduo channel tether stop` and `start`. The URL becomes the OAuth issuer and the passkey's
  hostname, so it must not change later.

The check (on a tailnet route pin the public address, as `routes/setup.md` shows):

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X POST 'https://<host name>/mcp'                # 401
curl -sS -D - -o /dev/null -X POST 'https://<host name>/mcp' | grep -i '^www-authenticate'
curl -sS 'https://<host name>/.well-known/oauth-protected-resource'                         # JSON
curl -sS 'https://<host name>/.well-known/oauth-authorization-server'                       # JSON
```

The 401 carries `Bearer resource_metadata="https://<host name>/.well-known/oauth-protected-resource"`,
and the metadata's `resource` and `issuer` equal `https://<host name>` exactly. Anything else (a
loopback address, a port, a relay's connect URL) means `ALADUO_TETHER_PUBLIC_URL` is wrong.

### 2. Passkey, first time only

`duoduo channel tether passkey list`. If the owner already has a passkey, go to step 3.

Until the first passkey exists, whoever opens an enrollment link first enrolls it and can approve
connections, so enroll it right after the URL is set. `duoduo channel tether status` warns while a
public URL is set and no passkey exists.

- `duoduo channel tether list` prints `No connected assistants.` and the owner asked you in the
  one-to-one chat: run `duoduo channel tether passkey add`. It prints one link,
  `https://<host name>/enroll#…`. Send it verbatim to the owner in the one-to-one chat, never a
  group, as one message: "Open this link on the device that will hold your passkey, and create the
  passkey there. It works once. Tell me when the page says the passkey is saved." Then check
  `passkey list`: exactly one passkey, created when the owner said done. Any other passkey means
  someone else used the link: tell the owner, and remove it from a host terminal before any
  assistant connects. A new `passkey add` voids the old link, and the link stops working when the
  first client is connected.
- Any client is connected: `passkey add` refuses inside your session. The owner runs it in a
  terminal on this host, or asks an agent outside duoduo (for example Claude Code over SSH). Do not
  ask for the link; check `passkey list` after the owner says done. Once a passkey exists, the
  enrollment page also asks for an enrolled passkey before creating a new one.

### 3. The owner adds the connector

The playbook's section 2 gives what the owner does in the client, with the URL
`https://<host name>/mcp` (R7: a `tunnel_id` instead). An agent that runs its own OAuth (the
`sdk-listen.md` and some `generic.md` kinds) needs its handoff prompt first: do step 5 now, and the
agent prints the authorization link for the owner.

### 4. The owner approves; you check

Before the owner approves, tell the owner:

- Approve only a connection you started yourself, just now. The passkey approves whatever request
  is on the screen. Several products can share one client document (Cursor's serves GrokBot too),
  so the return address is what names the product.
- Approve only your own assistants. An assistant reads duoduo's memory and event log, so another
  person's agent (a partner's ChatGPT, someone else's duoduo) is never connected, whoever asks.
- Type the connection name we agreed. Every approval is a new connected assistant under the name
  typed; the name of an existing assistant of the same app replaces it, and another app's name is
  refused.
- Deny approves nothing and needs no passkey. It shows a "Connection denied" page and the app is
  not told; close the page.

The page shows the full client document URL and return address, both marked not verified, the
access asked for, and a name field prefilled from the client's host (for example `chatgpt-com`).
Only after the passkey does the channel fetch the client document and check the return address. A
refused name brings the page back with the reason; the owner edits it and touches the passkey
again. On a relay or gateway route, this first approval is also the redirect check: the browser
must land back in the assistant and the connection must complete, not stop on an error page of
whatever sits in between.

Then check: `duoduo channel tether list` shows the connection under its name. The assistant's
records read `◀ reported via <name> · client <client host>` in duoduo's event log.

### 5. Hand the assistant its prompt

Tool usage reaches the assistant through MCP, but its wake setup is its own work, on its side, and
nothing tells it to do that except the owner. Fill the playbook's handoff prompt (section 3):
connection name, host name, the sessions it may serve, and a unique acceptance marker (for example
`tether-check-<random 6 hex>`). Send the filled prompt to the owner in the one-to-one chat; the
owner pastes it to the assistant. The prompt carries no secret: a webhook key goes from the
client's panel to the host terminal, never through a prompt. Do the playbook's host-side setup
(section 1) once the assistant's wake exists, then check it (`doorbell list` shows a doorbell or
subscription for kinds that have one).

How mail, doorbells, subscriptions and the listen stream work:
[references/mail.md](references/mail.md).

### 6. Acceptance

Send the test from a session the assistant may serve, so its reply comes back there: the `Notify`
tool with target `tether:<name>`, or `duoduo session notify tether:<name> -m "<text>"` run inside
that session. The text names the marker and asks for the agreed reply.

It passes only when both hold:

- **A real, unprompted wake.** The owner confirms nobody prompted the assistant. For a doorbell,
  `plugin.log` shows no `doorbell ring failed` for it; for a subscription or listen stream, the
  assistant's run started without the owner.
- **The reply reaches the sender**: a mail from `tether:<name>` answering the test arrives in the
  sending session with the marker.

Delivery without a wake is not a pass (the assistant found the mail because someone asked). A
client with no wake (`generic.md`, Kind D) passes when the owner asks it to check duoduo and the
reply arrives; say plainly that it is not woken. If it fails, read the playbook's pitfalls, then
`operations.md`, Events.

### 7. Write the handoff

Add to the route's handoff note (`routes/setup.md`, Persistence; create one beside the channel's
state if the route had none). No credentials in it. Record per connection: the name, the client and
its playbook, the wake kind and where its client-side setup lives (an automation, a routine panel,
a subscriber process), the doorbell if any, the acceptance result with its marker, and how to end
it (`duoduo channel tether revoke <name>`).

## Later

- `duoduo channel tether list` shows connections; `duoduo channel tether revoke <name>` ends one.
- Status, tokens, limits, a hostname change, a lost passkey, a doorbell that does not ring, a
  suspected compromise, and what is measured:
  [references/operations.md](references/operations.md).
- A second passkey or a recovery while clients are connected goes through a host terminal or an
  outside agent, confirmed on the page with a passkey already enrolled.
