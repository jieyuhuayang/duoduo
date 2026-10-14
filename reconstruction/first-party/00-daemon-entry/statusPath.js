// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: statusPath  (minified: KR, daemon.pretty.js:32980)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function statusPath(paths) {
    return Fae.join(paths.registryDir, "status.json")
}
