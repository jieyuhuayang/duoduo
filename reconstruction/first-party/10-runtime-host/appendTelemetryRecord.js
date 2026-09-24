// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendTelemetryRecord  (minified: k5e, daemon.pretty.js:32811)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendTelemetryRecord(e, t) {
    await $e(e.telemetryDir), await b5e.appendFile(S5e(e, t.ts), `${JSON.stringify(t)}
`, "utf8")
}
