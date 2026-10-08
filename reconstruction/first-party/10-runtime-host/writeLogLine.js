// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeLogLine  (minified: Jd, daemon.pretty.js:32037)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function writeLogLine(e, t, n, r = {}) {
    !r.force && !isLogLevelEnabled(e) || console.error(formatLogPrefix(e), t, ...n)
}
