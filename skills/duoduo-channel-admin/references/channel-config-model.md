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
  entries); built-in tool names here are no-ops (the daemon warns and
  ignores them)
- `additionalDirectories`
- `claude.tools` (nested) — extra built-in tools added onto the
  core allowlist; see below

## Built-in tool surface (allowlist)

The claude runtime exposes a fixed **allowlist core** to every session:

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

If a descriptor carries built-in tool names in `allowedTools` /
`disallowedTools` that have no effect, it predates the allowlist
surface — migration lives in the v0.5.10 section of `duoduo-admin` →
`references/upgrade-playbook.md`. The daemon logs a `[claude-sdk]`
warning naming the stale entries, once per session subprocess, but a
name listed in BOTH keys is filtered out before that warning fires —
so read the effective surface rather than trusting a quiet log.

### Binding and runtime keys

- `runtime` — one of `claude`, `codex`, `grok`, or `pi`. The agent runtime this
  instance is bound to. Readers default to `claude` when absent. Set it in a kind
  descriptor to make a default for all channels of that kind, or in an instance
  descriptor for one specific channel. For Feishu, prefer the `/setup` card
  when possible so the plugin's active binding cache and descriptor stay in
  sync. Explicit `grok` that cannot be served is a hard failure (no silent
  Claude fallback); explicit `pi` is the same posture — pi ships inside duoduo
  and is always available, but a pi session with no model pointer
  (`provider/modelId`) fails actionably instead of running on Claude.
  `prompt_mode` applies to claude, grok, and pi; combining it with
  `runtime: codex` is rejected.
- `bound_by` — channel-local identity of the operator who ran setup
  (e.g. a Feishu `open_id`). Used by channel-feishu's `/setup` command
  to decide whether a re-bind attempt in a group chat is allowed. A
  descriptor without this field falls back to `FEISHU_GROUP_CMD_USERS`
  for `/setup` permission.
- `bound_at` — ISO timestamp of the spawn that wrote the descriptor.
  Informational only; no runtime behavior depends on it.

## Workspace priority — descriptor wins over session state

The workspace resolver reads `descriptor.new_session_workspace` BEFORE
falling back to session state, so editing it takes effect on later
ingresses of a live channel. Caveat: this only applies when the
incoming ingress does NOT also pass a legacy explicit `cwd_abs` — that
legacy path still takes priority (and logs a deprecation warning) as
long as adapters keep sending it. In practice:

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
