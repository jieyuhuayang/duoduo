// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderPartitionRuntimeContext  (minified: Vgt, daemon.pretty.js:85802)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderPartitionRuntimeContext(e, t) {
    let n = [`## Runtime Context
`];
    return n.push(`Timestamp: ${new Date().toISOString()}`), t && n.push(`Sessions: ${t.activeCount()} active (channel: ${t.activeChannelCount()}, job: ${t.activeJobCount()})`), n.push(""), n.push("### Key Paths"), n.push(`- Kernel root: ${e.kernelDir}/`), n.push(`- Shared memory (global, read/write by all sessions): ${e.memoryDir}/`), n.push(`- Shared memory broadcast board: ${e.memoryBroadcastPath}`), n.push(`- Shared memory entities: ${e.memoryEntitiesDir}/`), n.push(`- Shared memory topics: ${e.memoryTopicsDir}/`), n.push(`- Shared memory fragments: ${e.memoryFragmentsDir}/`), n.push(`- Registry: ${e.registryDir}/`), n.push(`- Events (Spine): ${e.eventsDir}/`), n.push(`- Spine CLI: ${e.cliEntryPath} spine`), n.push(`- Jobs: ${e.jobsDir}/`), n.push(`- Per-partition directed inboxes (parent): ${e.subconsciousVarDir}/`), n.join(`
`)
}
