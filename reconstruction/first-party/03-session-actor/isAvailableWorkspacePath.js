// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isAvailableWorkspacePath  (minified: dRe, daemon.pretty.js:80565)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAvailableWorkspacePath(e) {
    return !e || !d_t.isAbsolute(e) ? !1 : c_t(e)
}
