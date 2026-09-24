// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderJobPromptModeDescription  (minified: cat, daemon.pretty.js:63750)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobPromptModeDescription() {
    return `How this job's system prompt is assembled.${isCodexAvailable()?" Combining it with runtime:'codex' is rejected, because codex has no Claude Code preset and would receive identical text either way.":""}
- 'append' (default): the runtime coding preset, then the identity / kind / instance prompt layers.
- 'override': drops the runtime coding preset/persona; on pi the harness's resident operating floor (tool list + guidelines) is retained.
Use 'override' for a job whose work is not software engineering and that does not need the coding-agent preset.`
}
