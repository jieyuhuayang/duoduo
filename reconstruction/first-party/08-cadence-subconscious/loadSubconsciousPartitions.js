// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: loadSubconsciousPartitions  (minified: hS, daemon.pretty.js:66462)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.1, v0.8.1 (maps/history_daemon.json)
// locals: 12 renamed — 1 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadSubconsciousPartitions(paths) {
    let dirEntries;
    try {
        dirEntries = await al.readdir(paths.subconsciousDir, {
            withFileTypes: !0
        })
    } catch {
        return []
    }
    let partitionNames = dirEntries.filter(dirEntry => dirEntry.isDirectory() && !hH.has(dirEntry.name)).map(dirEntry => dirEntry.name),
        partitions = [];
    for (let partitionName of partitionNames) {
        let partitionDir = RO.join(paths.subconsciousDir, partitionName),
            claudeMdPath = RO.join(partitionDir, "CLAUDE.md");
        try {
            await al.access(claudeMdPath)
        } catch {
            continue
        }
        let partitionDefinition = await parsePartitionDefinition(partitionName, partitionDir, claudeMdPath);
        partitionDefinition && partitions.push(partitionDefinition)
    }
    return partitions.sort((a, b) => a.name.localeCompare(b.name))
}
