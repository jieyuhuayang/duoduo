// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSelectableJobRuntimes  (minified: Rdt, daemon.pretty.js:65358)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): `ManageJob` also always exposes the effective `runtime` field.
// changelog v0.8.0 (high): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listSelectableJobRuntimes() {
    let runtimes = [];
    return isClaudeAvailable() && runtimes.push("claude"), isCodexAvailable() && runtimes.push("codex"), isGrokAvailable() && runtimes.push("grok"), runtimes.length === 0 && runtimes.push("claude"), runtimes.push("pi"), runtimes
}
