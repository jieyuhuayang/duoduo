// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolvePartitionStatePath  (minified: Pwe, daemon.pretty.js:66689)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePartitionStatePath(e, t) {
    return Zct.join(e.partitionStateDir, `${t}.json`)
}
