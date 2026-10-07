// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isRuntimeKind  (minified: gR, daemon.pretty.js:31669)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isRuntimeKind(e) {
    return typeof e == "string" && mR.includes(e)
}
