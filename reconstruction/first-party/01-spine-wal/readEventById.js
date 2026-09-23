// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readEventById  (minified: Md, daemon.pretty.js:32052)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readEventById(e, t, n) {
    let r = await nb(e, t);
    if (r) {
        let i = await K9e(e, r, t);
        if (i) return i
    }
    return n ? scanPartitionsForEventId(e, t, n) : null
}
