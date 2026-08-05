# Upgrade playbook (host mode)

Load this reference when the user asks to upgrade duoduo — especially
when they mention v0.5, "升级 duoduo", "升级到 v0.5", or a specific
version bump.

## Upgrading from inside a session (read this first if you are an agent)

If you are an agent running inside a duoduo session and the user asked you to
upgrade the host, **the daemon restart will kill you mid-command.** The restart
tears down the session-manager, which kills every SDK subprocess — including
the one running your Bash tool. Anything you planned to do after the restart
does not happen, and you cannot report that, because the turn dies too.

This is not hypothetical: on 2026-08-05 an agent upgraded a production host
this way, stopped the Feishu gateway, restarted the daemon, and died there.
The gateway stayed down and the bot silently accepted messages without
answering until a human noticed.

**On every released version up to and including v0.7.0, there is no safe way
to upgrade from inside a session — including `duoduo upgrade`.** Ask the user
to run it from a terminal, or over SSH. Both are outside the daemon's process
tree and unaffected.

Two ways the attempt fails, neither of which reports anything:

- **`duoduo upgrade`** stops the gateways, restarts the daemon, and dies before
  restarting them. Worse than doing nothing, because it leaves them stopped.
- **Manual step-by-step** (`npm install -g`, then `duoduo daemon restart`) ends
  your turn at the restart, with the channels in whatever state you left them.

From **v0.7.1** `duoduo upgrade` detects this case and hands the run to a
detached process that the restart cannot reach, printing a log path first; pass
`--wake <your-own-session-alias>` to be notified once the gateways are back.
There is no flag for it and nothing in `--help` to detect — it is automatic, so
the version is the only signal. When it engages it says so, printing
"upgrade handed off to a detached process" before this turn ends.

Running from a terminal, over SSH, or from DuoduoManager? None of this applies
— you are not in the daemon's process tree.

## One-line summary

Standard upgrade is two commands:

```bash
npm install -g @openduo/duoduo@latest
duoduo daemon restart -r "upgraded @openduo/duoduo to <version>"
```

**Crossing into v0.7.0 needs a third step: reinstall and restart every
channel.** The gateways connect to the daemon over a unix socket from
that release on, so a gateway still running its old build cannot reach
the upgraded daemon — the bot accepts messages and answers none. See
"Transport change landing in v0.7.0" below; that section is mandatory
reading for this upgrade, not a footnote.

The rest of this playbook only matters when (a) the user is crossing
the v0.5 boundary AND has a Feishu channel, or (b) something goes
wrong and we need to fall back to first-principles.

### Prefer `duoduo upgrade` where it is available

On newer builds one command does both steps and does them better:

```bash
duoduo upgrade                 # or: duoduo upgrade 0.6.4
```

Detect support from the CLI, not from a version number: `duoduo --help`
shows `--wake` on the upgrade line exactly when this behavior is
present. Older builds ship a `duoduo upgrade` that takes only a version
and has none of the properties below — on those, use the two-command
form.

It is not just shorter. It installs into the prefix that owns the
**binary currently running**, which the manual `npm install -g` does
not: if duoduo was installed outside npm's default global prefix (the
DuoduoManager menubar app does exactly this), the manual command
installs a second copy elsewhere, leaves the running binary untouched,
restarts the old daemon, and reports success. It also fills in the
restart reason from the version it actually resolved, and waits for
the new daemon to pass a health check instead of assuming it booted.

From v0.7.0 on it **also upgrades the channel plugins** — installing
each one, restarting the daemon, then bringing the channels back, in an
order where a channel whose download failed keeps running its previous
build instead of being stopped. This is the step people forget when
upgrading by hand. Note it cannot help the upgrade that *introduces*
it: an upgrade run from a pre-0.7.0 CLI executes the old code, so
crossing into v0.7.0 still needs the channels reinstalled manually.

If a session was mid-turn and should be told, the same flag applies:

```bash
duoduo upgrade --wake <session-or-alias>       # repeatable
```

On older versions, and any time you want the steps separated, use the
two-command form above — it works on every version.

## Step 1 — Preflight (accelerator)

Run the preflight script to collect upgrade-relevant facts in one
pass:

```bash
bash scripts/v05-upgrade-preflight.sh
```

Output is markdown. Look for the "Recommended branch" section at the
bottom — it names one of **Branch B / C / D** described below.

### If the preflight script is unavailable or errors

Reproduce each probe manually (every section of the script is
documented here so the agent can skip the script entirely):

```bash
duoduo --version                       # installed version
npm view @openduo/duoduo version       # latest published
duoduo daemon status                   # daemon running?
duoduo channel list                    # any feishu / wechat / acp?
grep -E '^FEISHU_(BOT_OWNER|ALLOW_FROM|DM_POLICY|GROUP_POLICY|GROUP_CMD_USERS)=' \
  ~/.config/duoduo/.env                # security env snapshot
ls ~/.aladuo/var/channels/feishu-*/descriptor.md 2>/dev/null
for d in ~/.aladuo/var/channels/feishu-*/; do
  grep -E '^bound_by:' "${d}descriptor.md" || echo "  (no bound_by — pre-v0.5)"
done
```

Then decide the branch by hand:

- No feishu channel installed → **Branch B**.
- Feishu installed AND `FEISHU_BOT_OWNER` set AND
  `FEISHU_DM_POLICY=allowlist` → **Branch C**.
- Feishu installed AND any of those keys missing → **Branch D**.

## Step 2 — Pick the branch

### Branch A — fresh install (not really an upgrade)

Skip this playbook. Send the user to onboarding (`duoduo` CLI from
empty state). Nothing v0.5-specific to discuss until they have a
channel configured.

### Branch B — upgrade, no Feishu

```bash
npm install -g @openduo/duoduo@latest
duoduo daemon restart -r "upgraded @openduo/duoduo to <version>"
```

Then verify:

```bash
duoduo --version                      # should show 0.5.x now
duoduo daemon status                  # healthy: yes; version: 0.5.x
```

Done. No further v0.5-specific action needed — the trust-boundary
changes only affect the Feishu channel.

### Branch C — upgrade with Feishu + security env already set

Safe to proceed. The agent should:

1. Run the upgrade:
   ```bash
   npm install -g @openduo/duoduo@latest
   duoduo daemon restart -r "upgraded @openduo/duoduo to <version>"
   ```
2. Restart the Feishu plugin to pick up the new plugin bundle (the
   plugin is a separate process; daemon restart does not restart it):
   ```bash
   duoduo channel feishu stop
   duoduo channel feishu start
   ```
3. Verify:
   ```bash
   duoduo --version
   duoduo channel list                # feishu shows @openduo/channel-feishu@0.5.x, running
   ```
4. Brief the user on the two new /setup behaviors they'll observe:
   - Owner DM (their personal DM with the bot): first message
     auto-spawns the main session; no setup card.
   - Groups: already-configured groups now show a compact "current
     configuration" card (mention toggle only) on `/setup`.

Hand off to `duoduo-channel-admin` → `references/feishu.md` for the
full behavior matrix if the user wants to see every case.

### Branch D — upgrade with Feishu but missing security env

⚠️ **Discuss with the user BEFORE running the upgrade.** After
upgrade, zero-config mode means any first DM sender triggers
auto-spawn into the owner's main session. With `dmPolicy=open` (the
default), strangers who reach the bot become the bot's main session.

Walk the user through:

1. Confirm the bot owner's Feishu open_id. Ask them to /whoami in
   an existing chat with the bot, OR grep Feishu developer console.
2. Propose additions to `~/.config/duoduo/.env`:
   ```bash
   FEISHU_BOT_OWNER=ou_<theirOpenId>
   FEISHU_ALLOW_FROM=ou_<theirOpenId>,ou_<friend>,...   # if not already set
   FEISHU_DM_POLICY=allowlist                           # if not already set
   ```
3. Show the diff with the existing `.env` and ask for confirmation
   before writing (sensitive file).
4. Write the additions using
   `duoduo-runtime-admin`'s
   [scripts/update_host_env.py](../../duoduo-runtime-admin/scripts/update_host_env.py)
   if available, otherwise hand-edit.
5. Then proceed with Branch C's upgrade + restart sequence.

If the user refuses to set security env right now, document the
risk in chat and let them proceed into "bootstrap mode" with their
eyes open. Do not block the upgrade — but do warn explicitly.

### Pre-v0.5 descriptors (legacy groups / DMs)

The preflight marks each existing descriptor as "v0.5 (has bound_by)"
or "pre-v0.5 (no bound_by — legacy binding)". Legacy descriptors
continue to work without migration. Their `/setup`:

- Groups: fall back to `FEISHU_GROUP_CMD_USERS` allowlist for the
  compact rebind card's permission check.
- p2p (DMs): route through the secondary-DM card path (no ⌂) so
  the user can still reassign project.

No action required for legacy descriptors unless the user reports a
specific problem with one.

## SDK architecture change landing in v0.5

v0.5 upgrades the bundled `@anthropic-ai/claude-agent-sdk` to
0.2.114, which ships the Claude Code runtime as a per-platform
native binary via npm optional dependencies (e.g.
`@anthropic-ai/claude-agent-sdk-darwin-arm64`). Implications for
upgraders:

- `npm install -g @openduo/duoduo@0.5.x` will download the
  platform-specific binary (~200 MB) automatically. On slow
  networks this is the new long step; previous versions only
  fetched JS.
- Installs with `npm install --omit=optional` or
  `NPM_CONFIG_OPTIONAL=false` will succeed but the daemon will
  refuse to start, with an actionable error naming the missing
  `@anthropic-ai/claude-agent-sdk-<platform>-<arch>` package.
  Reinstall without the flag, or set `CLAUDE_CODE_EXECUTABLE`
  to a compatible binary you already have. From the fixed v0.5
  patch line onward, successful host onboarding with
  `CLAUDE_CODE_EXECUTABLE` set persists that value in
  `~/.config/duoduo/.env`, and macOS launchd daemon starts forward
  the same value into the daemon environment.
- Users who previously installed `@anthropic-ai/claude-code` as
  a separate global package can uninstall it — duoduo now carries
  its own copy via the SDK. Keeping the standalone install is
  harmless but not required.
- Third-party compatible endpoints (sglang, LiteLLM proxies,
  older Bedrock/Vertex) may reject `thinking.type=adaptive`
  requests with HTTP 4xx. The daemon now surfaces this as a
  `[duoduo:drain-error]` reply instead of silence. The common
  workaround is setting `DISABLE_ADAPTIVE=1 DISABLE_THINKING=1
  DISABLE_INTERLEAVED_THINKING=1 MAX_THINKING_TOKENS=0` in
  `~/.config/duoduo/.env` and restarting the daemon.

## Runtime selection changes landing in v0.5.3

v0.5.3 treats Claude and Codex as peer runtime choices when both are
available on the host. Claude remains the default fallback, so existing
operators do not need to change anything unless they want Codex routing.

- To enable Codex availability, install the `codex` CLI, run
  `codex login`, and restart the daemon so it re-probes available
  runtimes.
- To route one channel kind to Codex, set `runtime: codex` in
  `kernel/config/<kind>.md`.
- To route one channel instance to Codex, prefer the channel setup flow
  when the channel provides one; otherwise update that instance
  descriptor deliberately.
- To make Codex the fallback for every actor without a more-specific
  declaration, set `ALADUO_DEFAULT_RUNTIME=codex` in
  `~/.config/duoduo/.env` and restart the daemon.

Do not tell users that an existing live conversation hot-swaps runtimes
the moment a default changes. If they need a clean runtime switch, rebind
or archive the affected session after inspecting current descriptors.

## Built-in tool surface change landing in v0.5.10

v0.5.10 flips the claude runtime's built-in tool surface from a denylist to
an **allowlist**: every session gets a fixed 16-tool core, and descriptors
add extras via the nested `claude.tools` frontmatter key (kind ∪ instance
union, additive-only). No file migration is required — upgrade + daemon
restart applies it to every session's next turn, and rollback is safe (older
versions ignore the `claude:` block).

Two descriptor recipes change meaning; check for them during preflight:

- `allowedTools: [WebSearch]` (the old re-enable recipe) no longer adds any
  tool — move the names to `claude: { tools: [...] }`. `allowedTools` keeps
  its SDK meaning (permission auto-approve) only.
- `disallowedTools` with built-in names (e.g. `Bash`) no longer blocks them —
  the daemon warns and ignores such entries, and a core tool listed there
  becomes available again after upgrade. `disallowedTools` remains effective
  for MCP tools (`mcp__…`) only.

Inspect any session's effective surface with
`duoduo session config <target> get` (read-only `claude_tools` block).
Full semantics: `duoduo-channel-admin` →
`references/channel-config-model.md#built-in-tool-surface-v0510-allowlist`.

## Transport change landing in v0.7.0

v0.7.0 moves the daemon's full-access interface off TCP and onto a unix
socket (`<runtime>/run/daemon.sock`, owner-only). `127.0.0.1:20233`
survives as a **read-only** surface for the dashboard and speaks no
WebSocket. Nothing about this is optional or gradual — both sides flip
at the restart.

**The upgrade step people miss: channels must be reinstalled.** A
gateway built before v0.7.0 dials the TCP port for its control
connection and gets refused by the upgraded daemon. Symptom, and it is
a quiet one: the bot keeps *receiving* messages and answers none — the
user sees read-but-no-reply. The gateway's own log goes silent after a
few reconnect lines; the signal that identifies it is on the daemon
side.

```bash
# after the core upgrade + daemon restart, per channel:
duoduo channel <kind> install
duoduo channel <kind> stop && duoduo channel <kind> start
```

Verify — all three should hold:

```bash
ls -l <runtime>/run/daemon.sock                  # srw------- (owner-only socket)
curl -s -X POST http://127.0.0.1:20233/rpc \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"session.list","params":{}}'
                                                 # -32601, method not available
duoduo channel list                              # every channel you use: running
```

A `426` in the daemon log (`pre-hardening client dialed /ws`) means a
gateway is still on the old build — that is the detector for "someone
forgot to reinstall a channel", and it repeats until fixed.

Two more consequences worth stating before someone trips on them:

- **`ALADUO_DAEMON_HOST` changed meaning.** It no longer moves the main
  port. The read-only port is pinned to loopback regardless. The
  variable now selects the bind address of the optional remote
  listener, which refuses to start unless `ALADUO_REMOTE_PORT` and a
  token (`duoduo daemon token new`) are also present. A host that
  previously set this to expose the daemon on a LAN address was
  publishing an unauthenticated control interface; that configuration
  now fails closed instead of starting.
- **A locally-configured `ALADUO_DAEMON_URL` pointing at
  `127.0.0.1:20233` keeps working.** The CLI recognises it as the old
  default and uses the socket instead. Do not "fix" such a value by
  pointing it somewhere else.

Rollback is a downgrade of both core and channels together; a new
daemon with old channels and an old daemon with new channels both fail
the same way.

## Stdio output behavior in v0.5.3

The stdio terminal UI buffers assistant text more cleanly around status
and tool output. This is a user-interface fix: no migration is required,
and channel protocols do not change.

## Subconscious prompts are NOT auto-upgraded

A duoduo version upgrade installs new code. It does **not** change
the partition prompt files already present under
`<kernel>/subconscious/` on an existing installation. The install
logic merges missing files only — this deliberately preserves
local edits, agent self-programming, and user-authored partitions.

The consequence: if v0.5.1 ships a revised `pattern-tracker` prompt
and the user upgraded from v0.5.0, their `pattern-tracker/CLAUDE.md`
is still the v0.5.0 version after the upgrade.

### When to bring it up

Mention this explicitly when:

- Release notes for the target version mention subconscious /
  partition prompt changes.
- The user asks why their behavior looks the same after upgrading.
- The user asks how the subconscious partitions evolve between
  versions.

### How to refresh

Refreshing the subconscious is a separate, opt-in action. Each
published duoduo version has a matching `v<X.Y.Z>` tag on
`openduo/duoduo` that carries the reference `subconscious/` tree for
that version. Pulling that tree into the kernel is:

1. Fetch the target tag's `subconscious/` directory from the public
   repo.
2. Compare it to the kernel's current `subconscious/`.
3. Overwrite only the files that exist upstream (so user-authored
   partitions and local edits on unchanged files are untouched).
4. Commit the result in the kernel git repo, producing a clear
   rollback point.
5. Wait one cadence interval — prompts reload from disk each tick;
   no daemon restart needed.

The full decision guide and command shapes for each step — including
how to handle user edits to shipped partitions, what to do if the
target tag does not exist, and how to revert — live in
[`duoduo-runtime-admin/references/subconscious-refresh.md`](../../duoduo-runtime-admin/references/subconscious-refresh.md).

### When NOT to refresh

- The user never mentioned subconscious behavior and their release
  notes don't flag prompt changes. Stay silent; don't push a refresh
  they didn't ask for.
- The user has substantial self-programming in shipped partition
  files (not new partitions, but edits to ones that came from the
  public repo). Discuss the trade-off before overwriting.
- The kernel git tree is dirty. Ask the user to commit or stash
  first; refreshing on a dirty tree mixes unrelated changes into the
  refresh commit.

## Step 2.5 — Refresh these skills (they do NOT come with the upgrade)

The skills are published from the GitHub repo; the npm package does not
contain them. `npm install -g @openduo/duoduo` and `duoduo upgrade` both
leave them exactly as they were. An agent that upgraded the CLI and kept
its old skills is now operating a version it has stale instructions for
— which is the failure mode where an agent confidently uses a command
shape that no longer exists.

So whenever the CLI version changes, offer to refresh:

```bash
npx -y skills add https://github.com/openduo/duoduo --global --all
```

Notes that matter in practice:

- Add `</dev/null` when running non-interactively over SSH; the
  installer otherwise waits on a menu that never gets an answer.
- `--all` is the reliable shape. Selecting individual skills with
  `--skill <name>` can hang on the same interactive prompt.
- Skills land in `~/.agents/skills/`. A new session picks them up
  immediately — no daemon restart, no session restart.

This is opt-in, not automatic: say the version changed and ask. Do not
silently rewrite files under the user's home as part of an upgrade they
scoped to the daemon.

## Step 3 — Post-upgrade verification

Always verify:

```bash
duoduo --version                       # 0.5.x
duoduo daemon status                   # healthy: yes; version: 0.5.x
duoduo channel list                    # each channel shows 0.5.x versions
```

If a channel shows an older version than expected, restart that
channel explicitly:

```bash
duoduo channel <kind> stop
duoduo channel <kind> start
```

If the daemon reports an older version than expected, first check that
the install landed where the running binary lives — a `npm install -g`
against a different prefix is the usual cause, and `duoduo upgrade`
avoids it on builds that support it:

```bash
which duoduo                          # the binary actually in use
npm root -g                           # where a bare `npm install -g` writes
```

If those disagree, re-install with an explicit prefix (or use
`duoduo upgrade`), then restart:

```bash
duoduo daemon restart -r "reinstalled @openduo/duoduo into the right prefix"
```

If they agree, the install raced the restart; a second restart with a
reason is enough. Note that `restart` is stop+start only on hosts
without launchd — on macOS it asks launchd to replace the process,
which loads the new binary either way.

## Step 4 — If something goes wrong

Fall back to first-principles diagnosis:

- Daemon won't start: check `duoduo daemon logs` for the first
  stack trace.
- Channel won't start: `duoduo channel <kind> logs`.
- Feishu-specific symptoms after upgrade: route to
  `duoduo-channel-admin` → `references/diagnose-feishu.md`.
- Accepted v0.5 limits (first-time group race, env typo unlock) are
  documented in `duoduo-channel-admin` →
  `references/feishu.md#accepted-v05-limits`.

The script is an accelerator. If it fails to run at all — sandbox
blocks it, missing bash features, PATH resolution issues — the agent
can still run every probe manually as shown in Step 1's fallback
section, and then follow the branch logic from there. Do NOT treat
the script as the only path.
