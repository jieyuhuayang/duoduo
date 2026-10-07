// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: writePartitionRunState  (minified: gH, daemon.pretty.js:66715)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writePartitionRunState(e, t, n) {
    await ensureDirectoryExists(e.partitionStateDir), await writeJsonFileAtomic(resolvePartitionStatePath(e, t), n)
}
