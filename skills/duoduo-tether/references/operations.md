# Running the tether channel

Day-to-day operation after setup: reading status, the channel's limits, what to do when something
changes or breaks, and what is measured. Read it from `SKILL.md` "Later", when the owner asks to
change a limit, or when a connection, passkey, doorbell or the hostname changes.

Contents:

- Status and list
- Tokens
- Limits
- Events
- Compromise
- What is measured

## Status and list

`duoduo channel tether status` shows the public URL (or `Public URL not set: no OAuth or MCP route
is served`), the address (`Listening <host>:<port>`), the passkey count, the connection count, and
today's record counts per connection name and client. While a public URL is set and no passkey
exists it adds a warning line (why: `SKILL.md` step 2).

`duoduo channel tether list` shows each connection: connection name, client name (its own claim),
`client_id`, `grant_id`, access, approval time, last use since the channel started. A connection
bound to an earlier public URL is refused on every call: `list` gives it a `refused` line naming the
old URL, and `status` counts it as refused, apart from the connected ones, until it is revoked.

The public URL is not secret: certificate-transparency logs publish every certificate, so the
hostname is public from its first one. Anyone can open the authorize page and read the metadata;
approving needs the owner's passkey.

## Tokens

Assistant access tokens do not expire. A token ends only when the owner revokes it, when the
assistant revokes it, when a new approval under the same name replaces it, or when the public
hostname changes (Events, below). There is no refresh token, and that is not a sign of expiry:
never tell the owner an assistant will need approval again because its token runs out.

- A CLI agent keeps its token on its own machine, one file per host:
  `$XDG_CONFIG_HOME/duoduo-tether/<host>.json` (by default `~/.config/duoduo-tether/<host>.json`),
  mode `0600`. Anyone who can read it acts as that assistant until the connection is revoked.
  `duoduo-tether logout` revokes the token and deletes the file; when the host is unreachable it
  keeps the file (exit 4), so run it again.
- Revoking or replacing a connection ends its open listen streams; their reconnect gets 401 (Events,
  below), and an unattended `listen` loop built on it stops.

## Limits

The channel's size and time limits have defaults; leave them unset unless the owner asks to change
one. The keys are in the channel's own documentation, and `duoduo channel tether status` names an
invalid one.

## Events

| Event                                               | Action                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The public hostname changes                         | Every connection and every passkey becomes invalid: they are bound to the old hostname. From a terminal on the host (or an outside agent): update `ALADUO_TETHER_PUBLIC_URL`, restart the channel, revoke every connected assistant, remove every passkey, then `passkey add` at once. The owner enrolls again and reconnects each assistant        |
| The owner loses one passkey device, another remains | `duoduo channel tether passkey remove <id>`. A new passkey comes from `passkey add` in a host terminal or an outside agent, confirmed on the page with a remaining passkey. Removing a passkey does not revoke connections it approved                                                                                                              |
| Every passkey is lost, clients are connected        | From a terminal on the host (or an outside agent), in this order: revoke every connected assistant by name, remove every passkey (the last one is refused while any assistant is connected, and inside a session), `passkey add`. The owner enrolls and reconnects each assistant                                                                   |
| A hosted client document is no longer needed        | `duoduo channel tether client remove <name>`. New approvals with its `client_id` are refused; assistants connected through it stay connected until `revoke <name>`                                                                                                                                                                                  |
| An assistant is not woken when mail arrives         | `doorbell list`: is there a doorbell or subscription for it? Then the channel's `plugin.log`: `doorbell ring failed` names the host and the status or error. Through a relay or gateway, a 2026-07-28 client (ChatGPT) that fails with -32020 is missing `Mcp-Method` or `Mcp-Name` (`routes/setup.md`, Requirements of every route)                |
| Mail does not move after an upgrade                 | `plugin.log` shows `<method>: duoduo did not answer` or `<method> refused` (for example `channel.spawn refused`): the daemon is down, or older than the channel. `duoduo daemon status`, then upgrade core and channel to the same version                                                                                                          |
| A doorbell is no longer needed                      | `duoduo channel tether doorbell remove <name> <url>`; `doorbell list` shows them                                                                                                                                                                                                                                                                    |
| A connection must end                               | `duoduo channel tether revoke <name>`, the connection name `list` shows (`dots`). Its next call gets 401 and its open listen streams end; other connected assistants of the same app stay connected                                                                                                                                                 |
| `/mcp` answers 401 or 503 to an assistant           | 401: the token is not found (missing, revoked, replaced, issued under another public URL); a CLI agent's commands exit 3. Retrying never helps: the owner approves a new connection. 503: the channel could not read its grants and checked no token; clients retry, and nothing needs a new approval. If it lasts, read the channel's `plugin.log` |
| `status` warns that no passkey exists               | Enroll the first passkey now (`SKILL.md` step 2), then check `passkey list` shows only the owner's                                                                                                                                                                                                                                                  |

## Compromise

If an assistant or its machine may be compromised: revoke every connected assistant
`duoduo channel tether list` shows, including ones you do not recognise, and check what the sessions
it mailed did. Have the owner rotate every secret (an API key, a password) that ever appeared in
a message or reply: an assistant reads those in full (`mail.md`, Mail). If any session acted on its requests and the host runs the daemon's
remote listener, also run `duoduo daemon token new --force >/dev/null` and
`duoduo daemon restart -r 'rotate the remote token after a connected-assistant compromise'`.

## What is measured

| Fact                                                                                                                                                                  | Status                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| MCP endpoint, OAuth, passkey enrollment and approval                                                                                                                  | Measured on a macOS host. Check the `passkey` verb exists (`SKILL.md` step 1)                                           |
| Client documents hosted by the channel (`client add`) for a self-built agent with a loopback callback                                                                 | Measured on a macOS host with a self-built agent                                                                        |
| Assistant mail: a session's `Notify` to `tether:<name>`, the assistant's `ReadMail` and `SendMail` reply                                                              | Measured on a macOS host with ChatGPT, Grok Bot and a self-built agent                                                  |
| Grok Bot woken by a `bearer` doorbell on a webhook-triggered routine in the Grok Bot app; ChatGPT subscribing itself through MCP Events                               | Measured on a macOS host (the subscription was created; a wake-up by it is not yet observed)                            |
| The `duoduo-tether` command line and its built-in client: login, the commands, `listen` and `listen --follow`                                                         | Tested in the channel's own suite; not yet checked on a host                                                            |
| Claude Code woken by a background `duoduo-tether listen`; Muse woken by `listen` as a tracked foreground process, after moving its existing token into the token file | Measured on a host: test mails answered unprompted                                                                      |
| Claude Code woken by `listen --follow` under Monitor; Codex; the unattended `listen` + `claude -p` loop                                                               | Not yet measured                                                                                                        |
| Redacted `ReadEvents`                                                                                                                                                 | Tested in the channel's own suite; not yet checked on a host                                                            |
| Command syntax in the route notes                                                                                                                                     | Read from `--help` of tailscale 1.102 and cloudflared 2026.9. Check `--help` on the host; flags change between versions |

What is measured for each route is in its notes file.
