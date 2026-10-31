// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: probeEventsAppendable  (minified: Mfe, daemon.pretty.js:89045)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeEventsAppendable(paths, now = new Date) {
    let eventPartitionName = formatEventPartitionName(now),
        partitionPath = kf.join(paths.eventsDir, eventPartitionName);
    try {
        return await (await Wnt.open(partitionPath, "a")).close(), !0
    } catch {
        return !1
    }
}
