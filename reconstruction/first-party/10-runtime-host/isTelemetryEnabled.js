// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isTelemetryEnabled  (minified: wYe, daemon.pretty.js:32919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **`ALADUO_TELEMETRY_ENABLED` env var**: set to `false` to disable `var/telemetry/*.jsonl` file persistence while keeping in-process debug telemetry logs intact.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isTelemetryEnabled(env = process.env) {
    return vU(env.ALADUO_TELEMETRY_ENABLED) ?? !0
}
