// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: replaceSessionIndexEntry  (minified: lq, daemon.pretty.js:36932)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function replaceSessionIndexEntry(e, t, n, r) {
    let i = Ret(t, n, r);
    if (i === null) {
        e.remove(t);
        return
    }
    e.remove(t), e.upsert(i)
}
