// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: detectEmptyRequiredPartitionOutput  (minified: kbt, daemon.pretty.js:86063)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.8, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectEmptyRequiredPartitionOutput(e, t) {
    return Sbt.has(e) && t.trim() === "(no output)" ? `invalid ${e} output: empty response` : null
}
