// duoduo reconstruction — subsystem: 09-memory
// symbol: listEventPartitionDates  (minified: oft, daemon.pretty.js:68173)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): The activation window counts days on which someone actually interacted, so a quiet week no longer ages memories out.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listEventPartitionDates(eventsDir) {
    let fileNames;
    try {
        fileNames = FH.readdirSync(eventsDir)
    } catch (err) {
        return recordUnreadableMemoryPath(err), []
    }
    let dates = [];
    for (let fileName of fileNames) {
        let match = rft.exec(fileName);
        match && dates.push(match[1])
    }
    return dates.sort(), dates
}
