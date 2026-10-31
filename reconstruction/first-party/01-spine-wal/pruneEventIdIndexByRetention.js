// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: pruneEventIdIndexByRetention  (minified: que, daemon.pretty.js:33480)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 13 renamed — 4 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function pruneEventIdIndexByRetention(paths, options) {
    let now = options.now ?? new Date,
        date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - options.retentionDays)),
        eventPartitionName = formatEventPartitionName(date),
        eventIdIndexPath = resolveEventIdIndexPath(paths),
        keptLines = [],
        droppedCount = 0;
    try {
        let stream = jU(eventIdIndexPath);
        for await (let line of iterateStreamLines(stream)) {
            if (!line) continue;
            let partition;
            try {
                partition = JSON.parse(line).partition
            } catch {
                droppedCount += 1;
                continue
            }
            typeof partition == "string" && partition >= eventPartitionName ? keptLines.push(line) : droppedCount += 1
        }
    } catch (err) {
        if (err.code === "ENOENT") return {
            kept: 0,
            dropped: 0,
            cutoff: eventPartitionName
        };
        throw err
    }
    if (droppedCount === 0) return {
        kept: keptLines.length,
        dropped: droppedCount,
        cutoff: eventPartitionName
    };
    let content = keptLines.length === 0 ? "" : `${keptLines.join(`
`)}
`;
    return await writeFileAtomic(eventIdIndexPath, content), {
        kept: keptLines.length,
        dropped: droppedCount,
        cutoff: eventPartitionName
    }
}
