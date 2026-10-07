// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: probeEventsAppendable  (minified: _de, daemon.pretty.js:87719)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeEventsAppendable(e, t = new Date) {
    let n = formatEventPartitionName(t),
        r = mf.join(e.eventsDir, n);
    try {
        return await (await Cet.open(r, "a")).close(), !0
    } catch {
        return !1
    }
}
