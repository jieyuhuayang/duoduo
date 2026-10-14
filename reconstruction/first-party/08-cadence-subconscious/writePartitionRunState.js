// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: writePartitionRunState  (minified: yH, daemon.pretty.js:66716)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writePartitionRunState(paths, partitionName, state) {
    await ensureDirectoryExists(paths.partitionStateDir), await writeJsonFileAtomic(resolvePartitionStatePath(paths, partitionName), state)
}
