// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventToPartition  (minified: aXe, daemon.pretty.js:33309)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventToPartition(paths, event, date = new Date(event.ts)) {
    await ensureDirectoryExists(paths.eventsDir);
    let eventPartitionName = formatEventPartitionName(date),
        partitionPath = tI.join(paths.eventsDir, eventPartitionName),
        line = `${stringifyJsonlRecord(event)}
`;
    return enqueuePartitionAppend(partitionPath, async () => {
        let handle = await eI.open(partitionPath, "a");
        try {
            let size = (await handle.stat()).size,
                bytesWritten = (await handle.write(line)).bytesWritten;
            return {
                event,
                partition: eventPartitionName,
                byteOffset: size,
                byteLength: bytesWritten
            }
        } finally {
            await handle.close()
        }
    })
}
