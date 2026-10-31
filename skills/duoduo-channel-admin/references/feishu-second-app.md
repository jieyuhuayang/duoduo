# Run a second Feishu or Lark app

Running another bot identity (a Lark app, a second tenant or company) as a
**named instance** of the feishu channel; one package serves them all.

## Contents

- Policy and steps (name, env file and secret handover, start)
- Calling the API as the instance's bot (lark-cli profile)
- What an instance shares and keeps; lifecycle, upgrade, reset
- Situations

To have chats of the new app talk to sessions that already exist (one
context, several bots), finish this file, then read
[feishu-forward.md](feishu-forward.md).

## Policy

1. One app = one instance = one process. The instance without `--instance`
   is the **default instance**, which is today's single-app setup, unchanged.
2. The instance name stands for the company or tenant, not the domain
   (`acme`, `intl`), and it is part of every session key of that app.
3. Secrets never pass through chat. The owner writes them into the
   instance's env file from their own terminal; duoduo only creates the file
   shape and checks it.
4. A named instance never claims the main session and never inherits the
   default app's credentials.

## Steps

1. **Pick a name.** Letters, digits, `_` and `-`, lowercase only. `default`
   is reserved. A name so long that the instance's socket path would exceed
   the platform limit is refused with that reason.
2. **Create the env file** `~/.config/duoduo/feishu.<name>.env`, mode 0600,
   with the same key names as `~/.config/duoduo/.env`:

   ```bash
   FEISHU_APP_ID=cli_xxx
   FEISHU_APP_SECRET=xxx
   FEISHU_DOMAIN=lark          # only for a Lark (international) app; omit for Feishu
   FEISHU_BOT_OWNER=ou_xxx     # optional; the owner's open_id IN THIS APP
   # FEISHU_DM_POLICY / FEISHU_GROUP_POLICY / FEISHU_ALLOW_FROM / FEISHU_ALLOW_GROUPS as needed
   ```

   Hand the secret over without chat: have the owner run, in their own
   terminal,

   ```bash
   umask 077
   ${EDITOR:-nano} ~/.config/duoduo/feishu.<name>.env
   chmod 600 ~/.config/duoduo/feishu.<name>.env
   ```

   and paste the App ID and App Secret there. Ask only for confirmation that
   it is saved. Verify with `stat` (mode) and `grep -c '^FEISHU_APP_SECRET='`
   (presence), never by printing the file.

   An open_id is per app: the owner's open_id in the Lark app differs from
   the one in the Feishu app. Copy it from the new app, not from `.env`.

   The owner DM of a named instance auto-spawns and locks exactly like the
   default app's (and zero-config admits any first sender); it only never
   claims `main`.

3. **Start it:**

   ```bash
   duoduo channel feishu start --instance <name>
   duoduo channel feishu status               # lists the default instance and every named one
   duoduo channel feishu logs --instance <name>
   ```

   Start is refused, with the reason, when the file is missing, is not mode
   0600, or lacks `FEISHU_APP_ID` / `FEISHU_APP_SECRET`.

4. **Configure the app in its developer console** the same way as the first
   one (event subscription, card callback, published version). For card
   error 200340, stop the instance and run
   `duoduo channel feishu doctor --instance <name>`.

## Calling the Lark/Feishu API as the instance's bot

For API work beyond the channel (documents, calendars, lookups), use
lark-cli with a profile for the instance, so the call runs as that app's
bot.

1. Add a profile named after the instance, with the app id and brand
   (`feishu`, or `lark` for an international app). The App Secret goes in
   on stdin, piped from the instance's env file, with one pair of
   surrounding quotes stripped — never pasted, never echoed:

   ```bash
   grep '^FEISHU_APP_SECRET=' ~/.config/duoduo/feishu.<name>.env | cut -d= -f2- \
     | sed -e "s/^[\"']//" -e "s/[\"']\$//" \
     | lark-cli profile add --name <name> --app-id <app id> --brand <feishu|lark> --app-secret-stdin
   ```

   lark-cli keeps the secret in the OS keychain. Never pass the secret as an
   argument or through `$(...)` on the command line; if the installed
   lark-cli has no `--app-secret-stdin` (`lark-cli profile add --help`),
   stop and ask the owner.
2. Rotating the app secret means updating both the instance's env file
   (then `stop` + `start` the instance) and the lark-cli profile.
3. Messages into a forwarded chat are not API work: see
   [feishu-forward.md](feishu-forward.md), "Answer a forwarded chat".

## What the instance shares and what it keeps

| Shared with the default instance | Kept per instance |
| --- | --- |
| The installed package and its version | App credentials and every `FEISHU_*` setting (only its own file) |
| The daemon, its workspace and kind config (`config/feishu.md`) | pid, log, run dir, message cache, admin socket, forward table |
| Host-level daemon transport keys from `.env` | Session keys `lark-<name>:<chat>:…`, channel ids `feishu-<name>-<chat>` |

`FEISHU_*` values in `.env` or the shell do not leak into a named instance.
Two companies' bots in one cross-tenant group get two separate sessions.

## Lifecycle

Every lifecycle verb takes `--instance <name>`:

```bash
duoduo channel feishu start  --instance <name>
duoduo channel feishu stop   --instance <name>
duoduo channel feishu status [--instance <name>]
duoduo channel feishu logs   --instance <name>
duoduo channel feishu doctor --instance <name>
```

After editing the instance's env file, `stop` and `start` that instance only.
`duoduo upgrade` installs the new package once, stops every running instance,
restarts the daemon, then starts each instance that was running; stopped ones
stay stopped. A manual package install (`duoduo channel install …`) needs a
`stop` + `start` per running instance, like the default one.

To reset one chat of a named instance, archive its session
(`duoduo session archive lark-<name>:<chat>:…`, key from
`duoduo session list`) and stop + start the instance. The reset script also
works for a named instance with `--channel-id feishu-<name>-<chat_id>` and
`--plugin-cache <runtime_dir>/plugins/channels/feishu/instances/<name>/cache`.

## Situations

| Situation | Action |
| --- | --- |
| Same people meet in a Feishu group and a Lark group, owner wants one context | Second instance for Lark, then forward the Lark group to the Feishu group's session ([feishu-forward.md](feishu-forward.md)) |
| A second company's bot should only serve its own chats | Second instance; its chats get their own sessions through the setup card, as on the default app |
| The owner wants to talk to duoduo through the new app's DM | Forward that DM to `main` before its first message; a DM that already has a session keeps it until `forward --clear` (the role stays on the default app's DM) |
| The gateway runs on another host than the daemon | [feishu-forward.md](feishu-forward.md), "Diagnose" |
| A session needs the Lark/Feishu API as the new app's bot | lark-cli profile for the instance, secret piped from the env file (above); messages into a forwarded chat: [feishu-forward.md](feishu-forward.md) |
| Owner pasted the secret into chat anyway | Write it to the env file immediately, never repeat it in any output, and suggest rotating it in the developer console |
