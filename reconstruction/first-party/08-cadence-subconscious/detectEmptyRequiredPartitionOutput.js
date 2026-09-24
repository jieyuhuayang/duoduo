// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: detectEmptyRequiredPartitionOutput  (minified: zgt, daemon.pretty.js:85712)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectEmptyRequiredPartitionOutput(e, t) {
    return Fgt.has(e) && t.trim() === "(no output)" ? `invalid ${e} output: empty response` : null
}
