// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderPartitionRuntimeContext  (minified: Ikt, daemon.pretty.js:88281)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.3, v0.5.1, v0.5.3, v0.8.0 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function renderPartitionRuntimeContext(paths, sessionManager) {
    let lines = [`## Runtime Context
`];
    return lines.push(`Timestamp: ${new Date().toISOString()}`), sessionManager && lines.push(`Sessions: ${sessionManager.activeCount()} active (channel: ${sessionManager.activeChannelCount()}, job: ${sessionManager.activeJobCount()})`), lines.push(""), lines.push("### Key Paths"), lines.push(`- Kernel root: ${paths.kernelDir}/`), lines.push(`- Shared memory (global, read/write by all sessions): ${paths.memoryDir}/`), lines.push(`- Shared memory broadcast board: ${paths.memoryBroadcastPath}`), lines.push(`- Shared memory entities: ${paths.memoryEntitiesDir}/`), lines.push(`- Shared memory topics: ${paths.memoryTopicsDir}/`), lines.push(`- Shared memory fragments: ${paths.memoryFragmentsDir}/`), lines.push(`- Registry: ${paths.registryDir}/`), lines.push(`- Events (Spine): ${paths.eventsDir}/`), lines.push(`- Spine CLI: ${paths.cliEntryPath} spine`), lines.push(`- Jobs: ${paths.jobsDir}/`), lines.push(`- Per-partition directed inboxes (parent): ${paths.subconsciousVarDir}/`), lines.join(`
`)
}
