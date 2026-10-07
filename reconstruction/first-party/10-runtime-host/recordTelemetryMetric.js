// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: recordTelemetryMetric  (minified: _s, daemon.pretty.js:32935)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.4.5, v0.8.0 (maps/history_daemon.json)
// changelog v0.4.5 (high): **`ALADUO_TELEMETRY_ENABLED` env var**: set to `false` to disable `var/telemetry/*.jsonl` file persistence
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordTelemetryMetric(e, t, n, r) {
    let i = {
        kind: "metric",
        metric: t,
        value: n,
        ts: Date.now(),
        ...r
    };
    if (isTelemetryEnabled()) try {
        await appendTelemetryRecord(e, i)
    } catch {}
}
