// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendTelemetryRecord  (minified: yYe, daemon.pretty.js:32914)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendTelemetryRecord(e, t) {
    await Ne(e.telemetryDir), await pYe.appendFile(gYe(e, t.ts), `${JSON.stringify(t)}
`, "utf8")
}
