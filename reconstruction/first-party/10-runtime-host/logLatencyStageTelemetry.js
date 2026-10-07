// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: logLatencyStageTelemetry  (minified: go, daemon.pretty.js:32927)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function logLatencyStageTelemetry(e, t, n) {
    bYe() && logDebugMessage("[telemetry]", {
        stage: e,
        eventId: t,
        ts: Date.now(),
        ...n
    })
}
