// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: scanPartitionsForEventId  (minified: t5e, daemon.pretty.js:32078)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scanPartitionsForEventId(e, t, n) {
    let r = Date.parse(n.notAfter);
    if (!Number.isFinite(r)) return null;
    let i = formatEventPartitionName(new Date(r)),
        o;
    try {
        o = await oR.readdir(e.eventsDir)
    } catch {
        return null
    }
    let s = o.filter(a => Y9e.test(a) && a <= i).sort().reverse();
    for (let a of s) {
        let u = await findEventInPartitionFile(sR.join(e.eventsDir, a), t);
        if (u) return u
    }
    return null
}
