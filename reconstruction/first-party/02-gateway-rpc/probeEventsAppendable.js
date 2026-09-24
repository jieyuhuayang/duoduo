// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: probeEventsAppendable  (minified: Yle, daemon.pretty.js:87347)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeEventsAppendable(e, t = new Date) {
    let n = formatEventPartitionName(t),
        r = ef.join(e.eventsDir, n);
    try {
        return await (await NXe.open(r, "a")).close(), !0
    } catch {
        return !1
    }
}
