// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isTelemetryEnabled  (minified: _Ye, daemon.pretty.js:32919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.5 (high): **`ALADUO_TELEMETRY_ENABLED` env var**: set to `false` to disable `var/telemetry/*.jsonl` file persistence while keeping in-process debug telemetry logs intact.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isTelemetryEnabled(e = process.env) {
    return vU(e.ALADUO_TELEMETRY_ENABLED) ?? !0
}
