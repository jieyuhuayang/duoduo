# A cerebellum someone else runs

Read this when the owner's cerebellum is run by another person or service and reached through a
Tailscale node they share. The channel needs only its `wss://` URL and a token; everything else
in `SKILL.md` is the same.

## The onboarding text comes first

A provider usually sends a text written for you to follow: a share link, the `wss://` URL, and a
way to obtain the token (often a one-time code). Follow it step by step, with these rules on top:

- The token is written straight into `~/.config/duoduo/.env` by the command that receives it. It is
  never printed, echoed, pasted into chat, or written anywhere else. If a step would print it, pipe
  the output into the file instead, and show only the result ("written") to the owner.
- A one-time code is spent on first use. Run that step once; if it fails, report the error text
  and stop rather than retrying with variations.
- If `~/.config/duoduo/.env` already holds `AMBIENT_CEREBELLUM_URL` or `AMBIENT_CEREBELLUM_TOKEN`,
  stop and ask the owner before replacing either: another cerebellum may be in use.
- Where the text and this skill disagree about this host (env file location, room creation,
  serving to the phone), follow this skill: it tracks the channel's current behaviour.
- After the text's own steps, continue with `SKILL.md` step 3 (room) onwards.

## Accepting a shared Tailscale node

The provider shares one node of their tailnet with the owner's tailnet. Only a person can accept:

1. The owner opens the share link in a browser and signs in to Tailscale with the account that
   owns this host's tailnet. Accepting needs the **Owner** or **Admin** role on that tailnet; a
   member account is refused.
2. The owner picks the tailnet to receive the node (if they have several) and accepts.
3. Check from this host, with the full name the provider gave (`<node>.<tailnet>.ts.net`):

   ```bash
   tailscale status | grep <node>            # the shared node is listed
   curl -fsS https://<node>.<tailnet>.ts.net/health
   ```

| Symptom                                             | Cause and fix                                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| The share page says the account cannot accept       | The account is not Owner or Admin of the tailnet; an Owner or Admin accepts it                                          |
| Accepted, but the node is not in `tailscale status` | Accepted into a different tailnet than this host's; accept again into the right one, or ask for the link again          |
| `curl` cannot resolve the short name                | Shared nodes are reached by the full `<node>.<tailnet>.ts.net` name only; use it everywhere, including the `wss://` URL |
| Resolves but times out                              | This tailnet's ACL blocks the shared node, or the provider's ACL allows only port 443; use `https`/`wss` on 443 only    |
| The link says it expired or reached its limit       | Ask the provider for a new link                                                                                         |

The shared node is reachable only from this host and other devices of the owner's tailnet that the
owner's ACL allows. The phone does not talk to it: the phone reaches this host's channel, and the
channel reaches the cerebellum.

## Afterwards

- The cerebellum's operator sees the room's audio and keeps its own records; say so to the owner
  if the provider's text did not.
- One channel per room: a second channel opening the same room on the same cerebellum takes it
  over, and the first stops redialing (`superseded`, [channel.md](channel.md)).
- Moving to the owner's own cerebellum later changes only the two env keys
  ([operations.md](operations.md)).
