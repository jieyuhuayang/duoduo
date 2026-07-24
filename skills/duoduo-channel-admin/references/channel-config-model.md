# Channel Config Model

Use this reference when the user asks to change channel prompts, workspaces, or
streaming behavior.

## Two Editable Layers

- Kind descriptor: `kernel_dir/config/<kind>.md`
- Instance descriptor: `runtime_dir/var/channels/<channel_id>/descriptor.md`

Resolve `kernel_dir` and `runtime_dir` with `duoduo daemon config`.

## When To Edit Which Layer

- Edit the kind descriptor when the user wants a default for all channels of one
  kind such as all `stdio` sessions or all `feishu` rooms.
- Edit the instance descriptor when the user wants to customize one specific
  chat, room, or channel surface.

## Common Frontmatter Keys

- `new_session_workspace`
- `prompt_mode`
- `time_gap_minutes`
- `runtime`
- `stream`
- `allowedTools` — SDK permission auto-approve list; does NOT add tools to
  the model's surface
- `disallowedTools` — blocks MCP tools (`mcp__server` / `mcp__server__Tool`
  entries); built-in tool names here are deprecated no-ops on v0.5.10+
- `additionalDirectories`
- `claude.tools` (nested, v0.5.10+) — extra built-in tools added onto the
  core allowlist; see below

## Built-in tool surface (v0.5.10+: allowlist)

Since v0.5.10 the claude runtime exposes a fixed **allowlist core** to every
session instead of "everything minus a denylist":

`Bash, Read, Write, Edit, Grep, Glob, Agent, TaskOutput, TaskStop, Skill,
ToolSearch, TaskCreate, TaskGet, TaskUpdate, TaskList, SendMessage`

Everything else the SDK ships (WebSearch, WebFetch, TodoWrite, Workflow,
Monitor, Cron*, ScheduleWakeup, plan/worktree tools, …) is absent by default.
Add extras per kind or per instance with the nested `claude.tools` key:

```yaml
---
claude:
  tools:
    - WebSearch
    - WebFetch
---
```

Semantics:

- **Additive-only.** Kind and instance lists merge by union on top of the
  core; config can add tools, never remove core ones.
- **Applies at SDK subprocess (re)spawn** — typically the session's next
  turn after the edit (the daemon detects the config change and respawns);
  no daemon restart needed. Codex-runtime sessions ignore it entirely
  (codex built-ins cannot be restricted — that is why the key is namespaced
  `claude:`).
- **Inspect, don't guess**: `duoduo session config <target> get` shows a
  read-only `claude_tools` block (effective surface + which layer added
  what). It is not settable through `session.config` — edit the descriptor
  file.

An absent tool surfaces to the model as unavailable, not as policy — an agent
told to search the web typically loops WebSearch → WebFetch → `curl` → "no
internet" rather than reporting it. Check the effective surface before
treating that as a defect.

### Migrating from ≤ v0.5.9 (denylist era)

Older versions disabled `WebSearch`, `WebFetch`, `AskUserQuestion`,
`EnterPlanMode`, `ExitPlanMode`, `EnterWorktree` and let `allowedTools`
re-enable them. On v0.5.10+:

- `allowedTools: [WebSearch]` no longer re-enables anything — move the name
  to `claude.tools`.
- `disallowedTools: [<built-in>]` no longer blocks anything (a core tool
  listed there comes BACK). `disallowedTools` remains the lever for blocking
  MCP tools only.

Both dead recipes are self-announcing: the daemon logs a warning at every
session subprocess spawn naming the stale entries and pointing at
`claude.tools`. When diagnosing "tool missing / tool unexpectedly available"
after an upgrade, check the daemon log for `[claude-sdk]` warnings and run
`duoduo session config <target> get` to see the effective surface.

### v0.5+ additions

- `runtime` — one of `claude` or `codex`. The agent runtime this instance is
  bound to. Readers default to `claude` when absent. Set it in a kind
  descriptor to make a default for all channels of that kind, or in an instance
  descriptor for one specific channel. For Feishu, prefer the `/setup` card
  when possible so the plugin's active binding cache and descriptor stay in
  sync.
- `bound_by` — channel-local identity of the operator who ran setup
  (e.g. a Feishu `open_id`). Present only on v0.5+ descriptors. Used by
  channel-feishu's `/setup` command to decide whether a re-bind attempt
  in a group chat is allowed. Pre-v0.5 descriptors that lack this field
  fall back to `FEISHU_GROUP_CMD_USERS` for `/setup` permission.
- `bound_at` — ISO timestamp of the spawn that wrote the descriptor.
  Informational only; no runtime behavior depends on it.

## v0.5 priority-order fix — descriptor wins over session state

Before v0.5, `descriptor.new_session_workspace` only took effect on the very
first ingress of a channel. Once a session existed, the session's stored cwd
shadowed the descriptor forever, so editing `new_session_workspace` after
that point silently did nothing.

v0.5 fixed this at the daemon level. The workspace resolver now reads the
descriptor BEFORE falling back to session state. Caveat: the fix only
applies when the incoming ingress does NOT also pass a legacy explicit
`cwd_abs` — that legacy path still takes priority (and logs a deprecation
warning) as long as adapters keep sending it. In practice as of v0.5:

- `acp` defaults to not sending an explicit `cwd_abs`, so descriptor
  edits take effect on the next ingress without any adapter change.
- `feishu` and host-mode `stdio` still pass an explicit `cwd_abs`
  derived from adapter-local state, so they still shadow descriptor
  edits on a live instance.
- For `feishu`, the `/setup` flow compensates by refreshing the
  adapter's active-session cache on successful spawn, so a `/setup`
  rebind takes effect on the next message. Manually editing
  `descriptor.md` on a live Feishu instance without running `/setup`
  may not take effect until the channel restarts.
- Old active sessions continue under their old cwd until they idle
  out; the new cwd applies when a new session materializes under the
  updated descriptor.
- No migration is required — users who previously edited this key
  without effect see it start applying in the scenarios above after
  the upgrade.
- The legacy `cwd_abs` ingress path is deprecated and planned for
  removal; a future release will move all bundled adapters onto
  descriptor-only workspace resolution.

## Prompt Assembly

- Kind prompt: Markdown body of `kernel_dir/config/<kind>.md`
- Instance prompt: Markdown body of `descriptor.md`

Effective behavior is:

1. identity prompt
2. kind prompt
3. instance prompt

Instance values replace kind values for the same key.

## Safe Editing Rule

Prefer edits that preserve:

- YAML comments in bootstrapped kind descriptors
- the existing Markdown body unless the user asked to rewrite the prompt
- unrelated keys already set by the operator
