// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: getOrCreateEventIdIndexCache  (minified: K8e, daemon.pretty.js:32212)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getOrCreateEventIdIndexCache(e) {
    let t = resolveEventIdIndexPath(e),
        n = jR.get(t);
    if (n) return n;
    let r = {
        map: new Map
    };
    return jR.set(t, r), r
}
