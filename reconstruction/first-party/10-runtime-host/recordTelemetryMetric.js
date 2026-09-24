// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: recordTelemetryMetric  (minified: ps, daemon.pretty.js:32832)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
