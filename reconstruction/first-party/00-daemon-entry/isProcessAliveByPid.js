// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: isProcessAliveByPid  (minified: qut, daemon.pretty.js:88835)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isProcessAliveByPid(e) {
    if (e <= 0) return !1;
    try {
        return process.kill(e, 0), !0
    } catch {
        return !1
    }
}
