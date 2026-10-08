# The ambient channel: environment, verbs, endpoints, troubleshooting

Reference for `@openduo/channel-ambient` as this skill uses it. Read it when a setup step points
here, when a check fails, or when the owner asks what a setting does. The channel's own runbook is
`docs/deploy.md` in [openduo/ambient](https://github.com/openduo/ambient); it also covers running
the cerebellum, which this skill does not.

Contents:

- How the pieces fit
- Environment
- Verbs
- Rooms
- Endpoints
- State and logs
- Troubleshooting
- What is verified

## How the pieces fit

```
iPhone app (tsnet node duoduo-pocket) ──HTTPS, tailnet──▶ tailscale serve :443 on this host
Passport ──BLE──▶ iPhone app                                   │
                                                               ▼
                         channel-ambient on 127.0.0.1:<AMBIENT_HTTP_PORT>
                           │ Unix socket                │ wss:// + Bearer token
                           ▼                            ▼
                     duoduo daemon (rooms,         cerebellum (owner's): hearing,
                     sessions, the agent)          transcription, judgment, speech
```

- The channel reads its rooms and kind config from the daemon's directories, so it runs on the
  daemon's host.
- Everything audio goes to the cerebellum. When it is not the owner's own, room audio leaves this
  host for theirs.

## Environment

The duoduo CLI starts the channel and loads `~/.config/duoduo/.env`, filling only keys not already
set in its own environment. A key exported in the shell that runs `duoduo channel ambient start`
wins over the file. The plugin receives only keys on its manifest allowlist; a misspelled key never
arrives, and an `AMBIENT_*` key outside the list is reported as `env-knob-ignored`.

| Key                        | Required  | Meaning                                                                                                |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `AMBIENT_HTTP_PORT`        | yes       | The loopback port of the page and API. No default: two instances on one default port collide silently. |
| `AMBIENT_CEREBELLUM_URL`   | yes       | The cerebellum's WebSocket URL. `wss://`; `ws://` only to a loopback host for local debugging.         |
| `AMBIENT_CEREBELLUM_TOKEN` | yes       | The Bearer token the cerebellum expects. Secret: the owner writes it (`SKILL.md` step 2).              |
| `AMBIENT_HTTP_HOSTS`       | for serve | Comma-separated extra hostnames admitted in the `Host` header: the `<node>.<tailnet>.ts.net` name.     |
| `AMBIENT_HTTP_ORIGINS`     | for serve | Comma-separated extra browser origins: `https://<node>.<tailnet>.ts.net`.                              |
| `ALADUO_LOG_LEVEL`         | no        | `debug`, `info`, `warn` or `error`.                                                                    |
| `ALADUO_DAEMON_SOCKET`     | no        | Absolute daemon socket path, when the runtime directory is not `~/.aladuo`.                            |

There is no listen-host key: the channel always binds `127.0.0.1`. Room behaviour and transport
timing are not environment keys either; they live in the kind config and the room's descriptor.

A change to `.env` takes effect at the next `stop` and `start`.

## Verbs

| Command                             | What it does                                                          |
| ----------------------------------- | --------------------------------------------------------------------- |
| `duoduo channel ambient start`      | Starts the channel. Refuses with zero rooms or a missing required key |
| `duoduo channel ambient stop`       | Stops it: closes rooms, then the page server, then the daemon links   |
| `duoduo channel ambient status`     | Running or not, and the process                                       |
| `duoduo channel ambient logs`       | The channel's log, without looking for its path                       |
| `duoduo channel ambient doctor`     | Checks the installed plugin when `status` is not enough               |
| `duoduo channel ambient room add …` | Creates a room (below)                                                |
| `duoduo channel ambient room list`  | Lists rooms                                                           |

## Rooms

A room is a directory `ambient-<room_id>` under `<runtime_dir>/var/channels/`, created by the daemon
through `channel.spawn`. Its existence declares the room; the channel takes every such directory
as a room at startup and refuses to start when there is none.

```bash
duoduo channel ambient room add <room_id> --workspace <absolute path> \
  --runtime <claude|codex|grok|pi> [--name <display name>] [--pocket]
```

- Every argument except `--name` and `--pocket` is required; nothing has a default.
- `<room_id>` matches `[A-Za-z0-9_-]+`; with the `ambient-` prefix it must fit the daemon's
  128-character channel id limit.
- It refuses a room that exists. Changing a room's workspace moves it to a new session (the session
  key contains the workspace), so its history disappears from view: do not recreate a room to
  change it; ask the owner.
- `--pocket` writes the pocket instance prompt into the body of `descriptor.md`: short answers,
  the conclusion first, no markdown, suited both to reading and to being spoken.
- A new room is picked up at the next channel start.

Files in the room directory:

| File            | What it is                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- |
| `descriptor.md` | Frontmatter (`display_name`, `new_session_workspace`) and the room's instance prompt as body |
| `notes.md`      | The room's long-term knowledge. The agent writes it; it is re-read every turn                |
| daily JSONL     | The room's transcript and IM log: the app's history                                          |

Fallback without the verb: `scripts/create-room.sh` (`SKILL.md` step 3). Exit codes: 2 bad
arguments, 3 room exists, 4 daemon unreachable or refused.

## Endpoints

All on `http://127.0.0.1:<AMBIENT_HTTP_PORT>`, and through serve on `https://<node>.<tailnet>.ts.net`.

| Path                                  | Use                                                                                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /healthz`                        | `{"ok":true,"rooms":<n>}`                                                                                                                                         |
| `GET /api/state?room=<id>`            | `daemon_ok`, `cerebellum_ok`, `cerebellum_halt`, `config_issues`, `capture`, `ws_clients`, `limits`. Without `room` and more than one room: 400 listing the rooms |
| `/?room=<id>`                         | The browser page. `&embed=app` hides the room menu                                                                                                                |
| `/live`                               | WebSocket: conversation frames; with `hello`, the capture seat (ambient mode)                                                                                     |
| `GET /api/imlog`                      | The room's history                                                                                                                                                |
| `POST /api/voice?room=<id>`           | A voice note (phone hold-to-talk or a Passport press)                                                                                                             |
| `POST /api/upload?room=<id>&name=<f>` | A file attachment. Over `limits.upload_max_bytes`: 413                                                                                                            |

## State and logs

- `duoduo channel ambient logs`: one `listening` line, one `ready` line naming every room with its
  `cwd_abs` and `session_key`, then `cerebellum connected`.
- `/api/state` `config_issues`: a mistyped config key, a missing descriptor, a workspace fallback.
  None of them stops the process; read it after every start.
- `capture.owner` non-null means some device holds the room's microphone seat (the phone in
  ambient mode, or a browser page). Null is normal for a pocket room with ambient off.
- An answer that arrives while nothing holds the capture seat is not spoken: it is shown and
  recorded as an unspoken row.

The room's history and `notes.md` live in the room directory; speaker numbers and usage records
live on the cerebellum's host.

## Troubleshooting

**The channel stopped redialing the cerebellum.** `cerebellum_ok` is false, `/api/state` has a
`cerebellum_halt`, and the log says `cerebellum link halted; not redialing until restart`.

| `cerebellum_halt`            | Cause                                                                     | Fix                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `unauthorized`               | The cerebellum answered HTTP 401: the token is wrong or was revoked       | The owner rewrites the token line (`SKILL.md` step 2; remove the old line first), then restart                         |
| `superseded` (4001)          | Another connection opened this room on the same cerebellum after this one | Find the second channel serving the same room (another host, a dev copy) and stop one; then restart the one that stays |
| `unsupportedProtocol` (4002) | The cerebellum does not serve this channel's wire major version           | Install the channel version that matches the cerebellum; ask whoever runs the cerebellum which                         |

A refusal with any other HTTP status is logged as `cerebellum refused the connection` with its
status, and the channel keeps redialing: the cerebellum is down or unreachable. Check the URL, and
ask whoever runs it.

**403 from the page or API**

| Body                             | Cause                                                                             | Fix                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `{"error":"host not allowed"}`   | The `Host` name is not loopback, a private LAN address or in `AMBIENT_HTTP_HOSTS` | Add the exact `ts.net` name; restart. A raw `100.x` address is refused by design |
| `{"error":"origin not allowed"}` | A browser origin not in `AMBIENT_HTTP_ORIGINS`                                    | Add `https://<node>.<tailnet>.ts.net`; restart                                   |

The native app sends no `Origin`, so only the host gate applies to it.

**The channel refuses to start.** The log quotes the reason:

| Log line begins                                                                | Fix                                                                                                                    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `AMBIENT_HTTP_PORT must be a port number`                                      | Set the port (`SKILL.md` step 2)                                                                                       |
| `AMBIENT_CEREBELLUM_URL is not set`                                            | Set the URL                                                                                                            |
| `AMBIENT_CEREBELLUM_TOKEN is not set`                                          | The owner writes the token                                                                                             |
| `cerebellum url must be wss://`                                                | Use the `wss://` URL the owner was given                                                                               |
| `ambient: there is not a single room`                                          | Create a room (`SKILL.md` step 3)                                                                                      |
| `ambient bridge: the bridge: block of the kind config … is missing these keys` | The kind config is missing or edited. Restore it from the installed package's `config/ambient.md` with the owner's yes |
| `daemon unreachable: …`                                                        | `duoduo daemon status`; the line names the transport it tried                                                          |

**The app's check fails but the host checks pass.** See [pocket-app.md](pocket-app.md),
Troubleshooting.

**No speech while ambient mode is on, everything else works.** Speech is synthesized on the
cerebellum host. Tell whoever runs it; nothing on this host fixes it.

## What is verified

| Fact                                                                                    | Status                                                                                                                           |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Env keys and allowlist, loopback bind, host gate ranges (no `100.64/10`, no `*.ts.net`) | Verified in the channel's source                                                                                                 |
| Close codes 4001 superseded, 4002 unsupportedProtocol; 401 halts redialing              | Verified in the protocol and channel source                                                                                      |
| `room add` / `room list` verbs                                                          | Specified for the channel release that ships them; check `duoduo channel ambient room list` exists, else use the fallback script |
| `scripts/create-room.sh`                                                                | Argument validation tested without a daemon; the spawn call itself is not run in tests                                           |
| `ws_clients` counts the app's conversation socket                                       | Inferred from the channel's state handler; not measured with the app                                                             |
