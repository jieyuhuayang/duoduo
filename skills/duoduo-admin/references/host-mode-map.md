# Host-Mode Map

Use this reference when the request is "explain duoduo to me" or when you need
to orient a user before changing anything.

## Core Surfaces

- `duoduo daemon status`: runtime health, pid, runtime mode, plus the cadence
  heartbeat (last tick / interval), subconscious round progress (done/total),
  and the `memory_check` experiment-flag state — the reliable way to confirm an
  experiment flag landed, since the background daemon's env is not visible via
  `ps`
- `duoduo daemon config`: effective config and resolved paths
- `duoduo daemon restart -r "<what changed>"`: replace the running background
  daemon with a freshly started process that picks up new code and env-backed
  settings. **Always pass a reason.** It is delivered to every session that
  wakes after the restart, and a session whose turn the restart killed has no
  other way to learn why — otherwise its most likely conclusion is that a
  person interrupted it, which it will then state as fact. Say what changed
  ("upgraded core to 0.6.3"), not "restart". Add `--wake <session-or-alias>`
  (repeatable) for any session that was mid-answer: it does not wake on its
  own, so from that user's side an interrupted reply is indistinguishable from
  being ignored
- `duoduo daemon logs`: daemon logs
- `duoduo channel list`: installed channels and running state
- `~/.config/duoduo/.env`: persistent host-mode env-backed settings

## Filesystem Model

- `kernel_dir/config/<kind>.md`
  Holds per-channel-kind defaults such as `new_session_workspace`,
  `prompt_mode`, `runtime`, tool allowlists, and the kind-level prompt body.
- `runtime_dir/var/channels/<channel_id>/descriptor.md`
  Holds per-channel-instance overrides such as `display_name`,
  `new_session_workspace`, `prompt_mode`, `runtime`, `stream`, tool lists, and the
  instance-level prompt body.
- `runtime_dir/var/channels/<channel_id>/`
  Holds per-channel runtime data such as inbox/outbox/session attachments.

Use `duoduo daemon config` to discover the actual `kernel_dir` and `runtime_dir`
instead of assuming `~/aladuo` or `~/.aladuo`.

## Mental Model

- `stdio` is the default direct operator surface after onboarding.
- In host mode, the daemon runs as a detached background process with PID
  tracking.
- `duoduo` from the same real directory re-attaches the same stdio session
  rather than creating an unrelated one.
- Channel plugins extend duoduo to external surfaces such as Feishu.
- Kind descriptors define defaults for all channels of one kind.
- Instance descriptors override one specific channel instance.
- Host-mode persistence lives in files; changing a file is often the actual
  control-plane action.

## Upgrade Flow

Check the installed version and the latest published version:

```bash
duoduo --version
npm view @openduo/duoduo version
```

Update the CLI package:

```bash
npm install -g @openduo/duoduo@latest
```

Then restart the daemon, naming the version you just installed:

```bash
duoduo daemon restart -r "upgraded @openduo/duoduo to <version>"
```

Reason: the already-running background daemon keeps using the old code until it
is restarted. The `-r` string reaches every session woken afterwards, so a
session that was interrupted learns an upgrade happened instead of guessing it
was interrupted by a person.

On newer builds both steps collapse into `duoduo upgrade [version]`, which also
installs into the prefix that owns the running binary and supplies the reason
itself. See [upgrade-playbook.md](upgrade-playbook.md).

## Restart Rule

- Editing `~/.config/duoduo/.env`: requires
  `duoduo daemon restart -r "changed <setting>"` for env-backed daemon settings
  to take effect.
- Editing `kernel/config/<kind>.md` or `descriptor.md`: takes effect on the next
  relevant turn or new session binding; channel process restart is only needed
  when credentials or plugin process env changed.
