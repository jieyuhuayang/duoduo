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
exists it adds a warning line: whoever opens an enrollment link first enrolls the first passkey and
can approve connections.

`duoduo channel tether list` shows each connection: connection name, client name (its own claim),
`client_id`, `grant_id`, access, approval time, last use since the channel started. A connection
bound to an earlier public URL is refused on every call: `list` gives it a `refused` line naming the
old URL, and `status` counts it as refused, apart from the connected ones, until it is revoked.

The public URL is not secret: certificate-transparency logs publish every certificate, so the
hostname is public from its first one. Anyone can open the authorize page and read the metadata;
approving needs the owner's passkey.

## Tokens

Assistant access tokens do not expire. A token ends only when the owner revokes it, or when the
public hostname changes (Events, below). There is no refresh token, and that is not a sign of
expiry: never tell the owner an assistant will need approval again because its token runs out.

## Limits

The channel's size and time limits have defaults. Leave them unset unless the owner asks to change
one; each key below, in `~/.config/duoduo/.env`, overrides its default with a positive whole number.
An invalid value stops the channel at start, and the plugin log and `duoduo channel tether status`
name the key.

| Key                                                                     | What it bounds                                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ALADUO_TETHER_REQUEST_LIMIT_BYTES`                                     | The largest request the channel accepts, such as one whole recorded message (default 1 MiB)                             |
| `ALADUO_TETHER_CHALLENGE_CAP`                                           | Authorize and enrollment challenges outstanding at once; at the cap the oldest is dropped                               |
| `ALADUO_TETHER_CODE_LIFETIME_MS`, `ALADUO_TETHER_CHALLENGE_LIFETIME_MS` | How long an authorization code and a passkey challenge stay valid                                                       |
| `ALADUO_TETHER_CIMD_TIMEOUT_MS`, `ALADUO_TETHER_CIMD_MAX_BYTES`         | Fetching a client's document after the owner approves, and each event-subscription callback (verification and delivery) |
| `ALADUO_TETHER_TOOLS_LIST_TTL_MS`                                       | How long an MCP 2026-07-28 client may cache the tool list. Unset: no caching                                            |

## Events

| Event                                               | Action                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The public hostname changes                         | Every connection and every passkey becomes invalid: they are bound to the old hostname. From a terminal on the host (or an outside agent): update `ALADUO_TETHER_PUBLIC_URL`, restart the channel, revoke every connected assistant, remove every passkey, then `passkey add` at once. The owner enrolls again and reconnects each assistant                   |
| The owner loses one passkey device, another remains | `duoduo channel tether passkey remove <id>`. A new passkey comes from `passkey add` in a host terminal or an outside agent, confirmed on the page with a remaining passkey. Removing a passkey does not revoke connections it approved                                                                                                                         |
| Every passkey is lost, clients are connected        | From a terminal on the host (or an outside agent), in this order: revoke every connected assistant by name, remove every passkey (the last one is refused while any assistant is connected, and inside a session), `passkey add`. The owner enrolls and reconnects each assistant                                                                              |
| A hosted client document is no longer needed        | `duoduo channel tether client remove <name>`. New approvals with its `client_id` are refused; assistants connected through it stay connected until `revoke <name>`                                                                                                                                                                                             |
| An assistant is not woken when mail arrives         | `doorbell list`: is there a doorbell or subscription for it? Then the channel's `plugin.log`: `doorbell ring failed` names the host and the status or error. Through a relay or gateway, a 2026-07-28 client (ChatGPT) that fails with -32020 is missing `Mcp-Method` or `Mcp-Name`: the route must pass them (`routes/setup.md`, Requirements of every route) |
| Mail does not move after an upgrade                 | `plugin.log` shows `<method>: duoduo did not answer` or `<method> refused` (for example `channel.spawn refused`): the daemon is down, or older than the channel. `duoduo daemon status`, then upgrade core and channel to the same version                                                                                                                     |
| A doorbell is no longer needed                      | `duoduo channel tether doorbell remove <name> <url>`; `doorbell list` shows them                                                                                                                                                                                                                                                                               |
| A connection must end                               | `duoduo channel tether revoke <name>`, the connection name `list` shows (`dots`). Its next call gets 401; other connected assistants of the same app stay connected                                                                                                                                                                                            |
| `status` warns that no passkey exists               | Enroll the first passkey now (`SKILL.md` step 2), then check `passkey list` shows only the owner's                                                                                                                                                                                                                                                             |

## Compromise

If an assistant or its machine may be compromised: revoke every connected assistant
`duoduo channel tether list` shows, including ones you do not recognise, and check what the sessions
it mailed did. An assistant reads duoduo's messages and replies in full; tool output reaches it only
as a tool name and an outcome. Have the owner rotate every secret that ever appeared in a message or
reply (an API key, a password). If any session acted on its requests and the host runs the daemon's
remote listener, also run `duoduo daemon token new --force >/dev/null` and
`duoduo daemon restart -r 'rotate the remote token after a connected-assistant compromise'`.

## What is measured

| Fact                                                                                                                                    | Status                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| MCP endpoint, OAuth, passkey enrollment and approval                                                                                    | Measured on a macOS host; not yet in a tagged release. Check the `passkey` verb exists (`SKILL.md` step 1)              |
| Client documents hosted by the channel (`client add`) for a self-built agent with a loopback callback                                   | Measured on a macOS host with a self-built agent                                                                        |
| Assistant mail: a session's `Notify` to `tether:<name>`, the assistant's `ReadMail` and `SendMail` reply                                | Measured on a macOS host with ChatGPT, Grok Bot and a self-built agent                                                  |
| Grok Bot woken by a `bearer` doorbell on a webhook-triggered routine in the Grok Bot app; ChatGPT subscribing itself through MCP Events | Measured on a macOS host (the subscription was created; a wake-up by it is not yet observed)                            |
| Redacted `ReadEvents`                                                                                                                   | Tested in the channel's own suite; not yet checked on a host                                                            |
| Command syntax in the route notes                                                                                                       | Read from `--help` of tailscale 1.102 and cloudflared 2026.9. Check `--help` on the host; flags change between versions |

What is measured for each route is in its notes file.
