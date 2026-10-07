// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSelectableJobRuntimes  (minified: llt, daemon.pretty.js:64087)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.4 (medium): `ManageJob` also always exposes the effective `runtime` field.
// changelog v0.8.0 (high): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listSelectableJobRuntimes() {
    let e = [];
    return isClaudeAvailable() && e.push("claude"), isCodexAvailable() && e.push("codex"), isGrokAvailable() && e.push("grok"), e.length === 0 && e.push("claude"), e.push("pi"), e
}
