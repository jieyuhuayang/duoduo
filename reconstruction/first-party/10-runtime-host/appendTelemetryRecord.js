// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendTelemetryRecord  (minified: yYe, daemon.pretty.js:32914)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendTelemetryRecord(paths, record) {
    await ensureDirectoryExists(paths.telemetryDir), await pYe.appendFile(gYe(paths, record.ts), `${JSON.stringify(record)}
`, "utf8")
}
