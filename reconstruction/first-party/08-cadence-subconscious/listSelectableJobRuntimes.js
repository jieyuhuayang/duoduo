// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSelectableJobRuntimes  (minified: hat, daemon.pretty.js:63768)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listSelectableJobRuntimes() {
    let e = [];
    return isClaudeAvailable() && e.push("claude"), isCodexAvailable() && e.push("codex"), isGrokAvailable() && e.push("grok"), e.length === 0 && e.push("claude"), e.push("pi"), e
}
