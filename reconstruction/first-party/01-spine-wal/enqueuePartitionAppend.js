// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: enqueuePartitionAppend  (minified: B8e, daemon.pretty.js:32091)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function enqueuePartitionAppend(e, t) {
    let r = (bae.get(e) ?? Promise.resolve()).then(t, t);
    return bae.set(e, r), r
}
