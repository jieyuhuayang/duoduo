// duoduo reconstruction — subsystem: 03-session-actor
// symbol: snapshotInflightEventIds  (minified: o0e, daemon.pretty.js:82858)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function snapshotInflightEventIds(e) {
    let t;
    for (let n of e.inflightEventIds)(t ??= new Set).add(n);
    return t
}
