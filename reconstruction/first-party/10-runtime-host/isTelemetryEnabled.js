// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isTelemetryEnabled  (minified: _Ye, daemon.pretty.js:32919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isTelemetryEnabled(e = process.env) {
    return vU(e.ALADUO_TELEMETRY_ENABLED) ?? !0
}
