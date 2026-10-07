// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: isRuntimeWriterLockStale  (minified: Fct, daemon.pretty.js:89247)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isRuntimeWriterLockStale(e, t, n) {
    let r = Date.parse(e.last_heartbeat_at);
    return !!(Number.isNaN(r) || t.getTime() - r > n || e.boot_id && e.boot_id !== getCachedHostBootId() || !isProcessAliveByPid(e.pid))
}
