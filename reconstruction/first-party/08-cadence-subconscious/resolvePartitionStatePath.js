// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolvePartitionStatePath  (minified: xke, daemon.pretty.js:68772)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePartitionStatePath(paths, partitionName) {
    return Jmt.join(paths.partitionStateDir, `${partitionName}.json`)
}
