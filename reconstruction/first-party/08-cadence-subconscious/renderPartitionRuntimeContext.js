// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderPartitionRuntimeContext  (minified: Ibt, daemon.pretty.js:86153)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.3, v0.5.1, v0.5.3, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderPartitionRuntimeContext(e, t) {
    let n = [`## Runtime Context
`];
    return n.push(`Timestamp: ${new Date().toISOString()}`), t && n.push(`Sessions: ${t.activeCount()} active (channel: ${t.activeChannelCount()}, job: ${t.activeJobCount()})`), n.push(""), n.push("### Key Paths"), n.push(`- Kernel root: ${e.kernelDir}/`), n.push(`- Shared memory (global, read/write by all sessions): ${e.memoryDir}/`), n.push(`- Shared memory broadcast board: ${e.memoryBroadcastPath}`), n.push(`- Shared memory entities: ${e.memoryEntitiesDir}/`), n.push(`- Shared memory topics: ${e.memoryTopicsDir}/`), n.push(`- Shared memory fragments: ${e.memoryFragmentsDir}/`), n.push(`- Registry: ${e.registryDir}/`), n.push(`- Events (Spine): ${e.eventsDir}/`), n.push(`- Spine CLI: ${e.cliEntryPath} spine`), n.push(`- Jobs: ${e.jobsDir}/`), n.push(`- Per-partition directed inboxes (parent): ${e.subconsciousVarDir}/`), n.join(`
`)
}
