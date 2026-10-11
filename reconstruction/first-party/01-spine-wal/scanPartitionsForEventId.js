// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: scanPartitionsForEventId  (minified: Z8e, daemon.pretty.js:32181)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanPartitionsForEventId(paths, eventId, options) {
    let notAfterMs = Date.parse(options.notAfter);
    if (!Number.isFinite(notAfterMs)) return null;
    let eventPartitionName = formatEventPartitionName(new Date(notAfterMs)),
        fileNames;
    try {
        fileNames = await LR.readdir(paths.eventsDir)
    } catch {
        return null
    }
    let candidates = fileNames.filter(fileName => H8e.test(fileName) && fileName <= eventPartitionName).sort().reverse();
    for (let fileName of candidates) {
        let eventInPartitionFile = await findEventInPartitionFile(FR.join(paths.eventsDir, fileName), eventId);
        if (eventInPartitionFile) return eventInPartitionFile
    }
    return null
}
