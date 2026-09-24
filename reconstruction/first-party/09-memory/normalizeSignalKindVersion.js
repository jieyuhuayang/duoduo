// duoduo reconstruction — subsystem: 09-memory
// symbol: normalizeSignalKindVersion  (minified: hve, daemon.pretty.js:66613)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeSignalKindVersion(e) {
    let t = e.trim();
    return /\.v\d+$/.test(t) ? t : `${t}.v1`
}
