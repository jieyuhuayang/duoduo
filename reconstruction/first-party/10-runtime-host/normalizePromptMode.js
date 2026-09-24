// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: normalizePromptMode  (minified: wb, daemon.pretty.js:35036)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizePromptMode(e) {
    return e === "append" || e === "override" ? e : void 0
}
