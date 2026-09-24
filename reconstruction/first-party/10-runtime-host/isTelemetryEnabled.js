// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isTelemetryEnabled  (minified: x5e, daemon.pretty.js:32816)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isTelemetryEnabled(e = process.env) {
    return bz(e.ALADUO_TELEMETRY_ENABLED) ?? !0
}
