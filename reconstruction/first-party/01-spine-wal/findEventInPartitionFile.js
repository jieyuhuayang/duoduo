// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: findEventInPartitionFile  (minified: zue, daemon.pretty.js:33460)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Readers that miss it fall back to the day's log partition, so nothing becomes unreadable — and `duoduo spine show <id>` falls back to a full scan.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function findEventInPartitionFile(filePath, eventId) {
    try {
        let stream = jU(filePath);
        for await (let line of iterateStreamLines(stream)) {
            if (!line) continue;
            let event = MU(line);
            if (event?.id === eventId) return event
        }
    } catch {
        return null
    }
    return null
}
