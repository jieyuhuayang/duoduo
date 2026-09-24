// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: getOrCreateEventIdIndexCache  (minified: n5e, daemon.pretty.js:32109)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getOrCreateEventIdIndexCache(e) {
    let t = resolveEventIdIndexPath(e),
        n = iR.get(t);
    if (n) return n;
    let r = {
        map: new Map
    };
    return iR.set(t, r), r
}
