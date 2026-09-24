// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: enqueuePartitionAppend  (minified: G9e, daemon.pretty.js:31988)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function enqueuePartitionAppend(e, t) {
    let r = (nse.get(e) ?? Promise.resolve()).then(t, t);
    return nse.set(e, r), r
}
