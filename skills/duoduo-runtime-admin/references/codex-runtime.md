# Codex Runtime

Use this reference before enabling or explaining Codex support.

## Prerequisites

- `codex` CLI installed and on `PATH`
- `codex` authenticated on this machine

Useful checks:

```bash
codex --version
codex login
```

## Host-Mode Availability (v0.5.3+)

Codex is **auto-detected**. There is no `ALADUO_CODEX_ENABLED` env
var. If `codex` is installed on `PATH` and `codex login status`
reports "logged in", the daemon exposes Codex as an available runtime
alongside Claude. Otherwise Codex is hidden from runtime choices and
runtime requests fall back to Claude.

Optional persistent key:

- `ALADUO_CODEX_SANDBOX=workspace-write` (or `read-only` /
  `danger-full-access`) — sandbox mode for codex-runtime jobs.

The daemon probes at boot. If the user installs codex or runs
`codex login` while the daemon is running, ask them to restart:

```bash
duoduo daemon restart -r "codex login refreshed — re-probing runtimes"
```

If the daemon seems not to see a freshly-logged-in codex, check with
`codex login status` directly to confirm the CLI side.

## Runtime Selection

Duoduo picks a runtime by specificity:

1. Actor-level declaration, such as a channel descriptor, job frontmatter, or
   partition frontmatter.
2. Channel-kind default in `kernel/config/<kind>.md`.
3. Global default: `ALADUO_DEFAULT_RUNTIME` (`claude`, `codex`, or `grok`).
4. Conservative fallback: `claude`.

Use `ALADUO_DEFAULT_RUNTIME=codex` only when the operator wants all actors
without a more-specific declaration to prefer Codex. For one channel kind,
edit that kind descriptor instead; for one channel instance, edit or re-run the
channel setup flow for that instance.

## Scope

Codex is now a peer runtime for channel sessions, jobs, and eligible background
partitions. Claude remains the default fallback and the safer recommendation
when the user has not explicitly asked to route work to Codex.

Do not claim existing sessions hot-swap immediately after changing defaults.
For a live channel, check its descriptor and session state, then rebind/archive
when the user wants a clean runtime switch.

## Tool-Surface Trim (recommended for duoduo hosts)

A default `~/.codex/config.toml` exposes the full apps connector catalog to
every codex session (~200 tools: Adobe/Canva/Figma/Gmail/quotes/weather …)
whenever auth looks like the ChatGPT backend, plus interactive-only tools.
duoduo sessions never use those. Recommended entries:

```toml
[features]
apps = false          # removes the codex_apps connector catalog
goals = false         # goal auto-continuation fights mailbox-driven turns

[tools]
experimental_request_user_input = { enabled = false }
```

Optionally disable user-level MCP servers duoduo sessions do not need
(`openaiDeveloperDocs`, the ChatGPT.app `node_repl`) with `enabled = false`.
Keep per owner preference: collaboration tools (`spawn_agent` & co.),
`image_gen`, `view_image`, web search, `update_plan`.

Feature gates are session-static: existing threads keep their tool surface
until the next fork/cold resume, so follow config edits with
`duoduo daemon restart -r "..."` for an immediate cutover. duoduo's codex
app-server shares `~/.codex` with manual `codex` use on the same host — the
trim applies to both.

## Caveats

- Codex project trust is local to the machine. Multi-host deployments need
  `codex login` and project trust on each host that will run Codex work.
- `workspace-write` sandbox blocks network access, including localhost. Use
  `ALADUO_CODEX_SANDBOX=danger-full-access` only when the user explicitly needs
  networked commands from Codex.
- Codex has no per-tool allow/deny lists like Claude's `allowedTools`; duoduo's
  per-tool restrictions are ignored on the codex runtime. The built-in surface
  can only be trimmed per family via the `~/.codex/config.toml` gates above,
  which are hard config, not instructions. duoduo-side MCP tools stay governed
  by the duoduo allowlist either way.
