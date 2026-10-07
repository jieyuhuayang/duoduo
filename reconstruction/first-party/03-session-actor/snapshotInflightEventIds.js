// duoduo reconstruction — subsystem: 03-session-actor
// symbol: snapshotInflightEventIds  (minified: ZRe, daemon.pretty.js:83158)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function snapshotInflightEventIds(e) {
    let t;
    for (let n of e.inflightEventIds)(t ??= new Set).add(n);
    return t
}
