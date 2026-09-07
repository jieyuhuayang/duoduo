# Grok Runtime

Use this reference before enabling or explaining Grok support.

## Prerequisites

- `grok` CLI installed and on `PATH`
- `grok login` completed on this machine

Useful check:

```bash
grok --version
```

The daemon treats grok as available when that command succeeds. It does
**not** probe the login, and neither should you: `grok models` prints its
auth header from the state it holds before refreshing, so on a logged-in
host whose access token has just expired it reports "You are not
authenticated." and still exits 0. Duoduo learns the login state from the
first real session, the same way it does for Claude.

## Host-Mode Availability

Grok is auto-detected. There is no `ALADUO_GROK_ENABLED` env var. If
`grok` is on `PATH`, the daemon exposes Grok as an available runtime
alongside Claude and Codex. Otherwise Grok is hidden from runtime
choices. A host that has the CLI but no login still advertises grok; the
auth error arrives when a grok session actually starts.

Do **not** set `GROK_HOME`. Do **not** inject `XAI_API_KEY`. Duoduo
reuses the host user's `~/.grok`.

The daemon probes at boot. If the user installs grok while the daemon is
running, ask them to restart:

```bash
duoduo daemon restart -r "grok installed — re-probing runtimes"
```

**`grok login` alone needs no restart** — login state enters no cache.

## Runtime Selection

Duoduo picks a runtime by specificity:

1. Actor-level declaration, such as a channel descriptor, job frontmatter, or
   partition frontmatter.
2. Channel-kind default in `kernel/config/<kind>.md`.
3. Global default: `ALADUO_DEFAULT_RUNTIME` (`claude`, `codex`, `grok`, or `pi`).
4. Conservative fallback: `claude`.

Use `ALADUO_DEFAULT_RUNTIME=grok` only when the operator wants all actors
without a more-specific declaration to prefer Grok.

**Grok has no silent Claude fallback.** An explicit `runtime: grok` (or a
grok global default) that cannot be served is a hard failure at drain
time. Codex unavailable still falls back to Claude; do not mix those
two sentences.

## ManageJob

- `runtime: grok` is a valid create parameter when Grok is available.
- `prompt_mode` applies to **claude and grok** (`append` default, or
  `override`). Combining `prompt_mode` with `runtime: codex` is
  rejected. Combining it with grok is accepted.

## Caveats

- v1 **does** send a denylist on `session/new` (scheduler / monitor /
  workflow / `update_goal` are not advertised; `/loop` is hidden).
  `SchedulerActor` still spawns. A new session id idles. What can still
  fire is scheduler state carried over by load/fork via
  `resources_state.json`. Do not write "Grok has no scheduler".
- Append-mode `<human_rules>` fold only at `session/new`. Editing a kind
  prompt does not hot-update a live append session.
- Do not symlink `AGENTS.md` onto a grok session the way Codex does —
  Grok already reads cwd `CLAUDE.md`.
- Host `~/.grok` is shared with the grok TUI. A TUI `/resume` may list
  duoduo ACP sessions. That is accepted in v1; it is not TUI-task
  leakage across HOME.
- Idle auto-compact uses the same two knobs as Claude
  (`auto_compact_idle_minutes` + `auto_compact_min_context_tokens`)
  and stays OFF until both are set. Codex remains excluded.
  Grok `/compact` does not return token counts, so the fuse never
  self-calibrates on a grok-only session: it skips only when a floor
  already exists. A threshold below the real floor costs one no-gain
  compact per activity cycle, not a 60s loop. Do not treat the first
  grok idle-compact as a calibration measurement.
