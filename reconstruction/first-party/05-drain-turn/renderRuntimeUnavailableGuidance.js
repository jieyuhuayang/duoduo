// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderRuntimeUnavailableGuidance  (minified: Cft, daemon.pretty.js:72358)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRuntimeUnavailableGuidance(e, t) {
    return t === "codex" ? ["Agent runtime 'codex' is unavailable. Request was not executed.", `- reason: ${e}`, "- Install the codex CLI, run `codex login`, then send the message again."].join(`
`) : t === "grok" ? ["Agent runtime 'grok' is unavailable. Request was not executed.", `- reason: ${e}`, "- Install the grok CLI, run `grok login`, then send the message again."].join(`
`) : t === "pi" ? ["This pi session has no model yet. Request was not executed.", `- reason: ${e}`, "- Model ids are canonical `provider/modelId`, and the providers are whatever your pi agent dir configures — `models.json`, or an extension that registers them.", "- Nothing to install: the pi runtime ships inside duoduo."].join(`
`) : ["Agent runtime 'claude' is unavailable. Request was not executed.", `- reason: ${e}`, "- The Claude Code native binary ships via the SDK's npm optional dependency. A failed/omitted download leaves it missing. Reinstall without --omit=optional (or set NPM_CONFIG_OPTIONAL=true), or install the matching `@anthropic-ai/claude-agent-sdk-<platform>-<arch>` package, then restart the daemon."].join(`
`)
}
