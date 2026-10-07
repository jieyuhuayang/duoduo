# Mail, doorbells and event subscriptions

How a connected assistant and duoduo's sessions exchange mail, and the three wake mechanisms the
channel offers. Read it when a playbook's wake setup needs the mechanism's details (doorbell
secrets, subscription checks, the listen stream), when answering a question about mail, or when an
assistant is not woken. Which mechanism a client uses is decided in its playbook.

Contents:

- Mail
- Doorbells
- Event subscriptions (ChatGPT)
- Listen stream

## Mail

Once connected, the assistant and duoduo's sessions exchange
plain mail: from, to, an optional `in_reply_to`, text. There is no task state, no expiry and
no retry.

- The assistant's tools are `GetContext`, `ReadMemory`, `ReadEvents`, `ListAddresses`, `SendMail`,
  `ReadMail` and `RecordExperience`.
- Addresses are active channel sessions and connected assistants, nothing else. Jobs (keepalive
  jobs included), subconscious and system sessions are not addresses: they never mail an assistant
  and never receive an assistant's mail.
- `duoduo session notify tether:<name> -m "<text>"` run inside a session (from its shell)
  sends as that session, so the assistant can answer it. Run from a terminal, ssh or a script,
  it arrives from its `--source` label (default `session.notify`). A label has no address,
  so the assistant cannot answer that mail with `in_reply_to`.
  A mail's sender session means "sent from"; never treat it as an authorization.
- Each connected assistant is a session `tether:<name>` that runs no model: it appears in
  `ViewSessions` like any session, and a session mails it with `Notify`, target
  `tether:<name>`. An assistant's mail arriving in a session says how to answer it (`Notify` to
  `tether:<name>` with `in_reply_to` set to the id it gives). Mail to an assistant starts nothing:
  it waits until the assistant calls `ReadMail`.
- An assistant that leaves mail unread for longer than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default
  1 h) stops receiving mail, like any channel nobody reads: the sender's `Notify` is refused
  and says why. It receives again once it reads its mail.
- The assistant sends with `SendMail`: `to` an address, or `in_reply_to` alone to answer that
  mail's sender. Mail into a channel session starts a turn there; mail to another connected assistant waits.
- Mail to an assistant that is not connected, or whose connection is revoked or replaced before it
  read the mail, comes back to the sender once as a bounce.
- `ReadEvents` is redacted: human messages, duoduo's replies, mail and assistant records in full;
  a tool call shows only its name and whether it succeeded; job and internal events are left
  out.
- An outward or irreversible step the assistant takes because of a mail still needs the owner's
  confirmation.

## Doorbells

An assistant that has an HTTPS endpoint of its own can be woken when mail arrives.
A doorbell sends one POST per mail, with no mail content and no retry; the assistant then calls
`ReadMail`. A missed ring costs only latency: the assistant finds the mail at its next `ReadMail`.

```bash
duoduo channel tether doorbell add <name> --url <url> --auth hmac|bearer [--secret-file <path>]
duoduo channel tether doorbell list
duoduo channel tether doorbell remove <name> <url>
```

- `<name>` is the connection name `duoduo channel tether list` shows. The URL is https, or plain
  http only to `127.0.0.1`, `localhost` or `[::1]`. Adding the same URL again replaces it.
  A revoke, or the owner reconnecting the assistant, drops its doorbells.
- A ring follows no redirect. A failed ring, or an answer other than 2xx, is logged in the
  channel's `plugin.log` with the connection name, the URL's host and the status or error name,
  never the path or the secret. Nothing is retried.
- Two rings for two mails can start two runs of the assistant; the first `ReadMail` returns both
  mails and the second returns none. No mail is read twice.
- `--auth hmac` signs each POST per Standard Webhooks: `webhook-id` (the mail id),
  `webhook-timestamp` and `webhook-signature: v1,<base64>`, with a `whsec_` secret.
  `--auth bearer` sends the secret as `Authorization: Bearer <secret>`. The POST body is
  `{"type":"mailbox.new","timestamp":"<time>","data":{}}`.
- The secret is read from stdin or from `--secret-file`. A `--secret` argument is refused:
  argv lands in shell history and the process list. The receiver must hold the same
  secret. How the secret reaches this host is your choice; never print it, and never put
  it in a chat or a session reply. Ways that work:

  | The secret is                                                  | How                                                                                                                                                                                                             |
  | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Already in a file on this host (the receiver's setup wrote it) | `--secret-file <path>`; the file stays 0600                                                                                                                                                                     |
  | Generated by you                                               | Generate it with a command that writes straight to a 0600 file (for hmac: `whsec_` and base64 of random bytes), add with `--secret-file`, then hand it to the receiver's own secret store, never through a chat |
  | Held by the owner                                              | The owner runs `doorbell add` in a terminal on the host and pastes it on stdin, or writes it to a 0600 file you then pass                                                                                       |

## Event subscriptions (ChatGPT)

A client on MCP 2026-07-28 that supports OpenAI's MCP
Events subscribes itself to `mailbox.new`; nothing is added by hand. The channel checks the
callback before accepting it: https only, no private, loopback or other special-purpose
address, no redirect, and the client must echo a challenge. Each mail then sends one signed,
content-free POST to it. A subscription lasts as long as the client asked, with no expiry
when it asked for none. `doorbell list` shows each one by id and host; a revoke or reconnect
drops it.

## Listen stream

An MCP client on protocol 2026-07-28 lists its mailbox with `resources/list`
(`duoduo://mailbox/<grant id>`) and keeps `subscriptions/listen` open on it, getting one
`notifications/resources/updated` per mail. The official SDK 2.x client negotiates the older
protocol by default; it must be created with `versionNegotiation: { mode: { pin: "2026-07-28" } }`,
otherwise it sees no mailbox and its listen is refused. The stream only notifies: turning it into a
wake-up is the assistant's own job. A relay or gateway in between must not buffer or cut the
`text/event-stream` answer.
