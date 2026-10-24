// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: recordTelemetryMetric  (minified: bs, daemon.pretty.js:35017)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.4.5, v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **`ALADUO_TELEMETRY_ENABLED` env var**: set to `false` to disable `var/telemetry/*.jsonl` file persistence
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordTelemetryMetric(paths, metric, value, extra) {
    let record = {
        kind: "metric",
        metric,
        value,
        ts: Date.now(),
        ...extra
    };
    if (isTelemetryEnabled()) try {
        await appendTelemetryRecord(paths, record)
    } catch {}
}
