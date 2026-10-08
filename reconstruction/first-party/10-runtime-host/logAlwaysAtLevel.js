// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: logAlwaysAtLevel  (minified: vt, daemon.pretty.js:32069)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function logAlwaysAtLevel(e, t, ...n) {
    writeLogLine(e, t, n, {
        force: !0
    })
}
