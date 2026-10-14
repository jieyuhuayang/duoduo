// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isPartitionBackedOff  (minified: _H, daemon.pretty.js:66720)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isPartitionBackedOff(state, now) {
    return state.backoff_until ? now.getTime() < new Date(state.backoff_until).getTime() : !1
}
