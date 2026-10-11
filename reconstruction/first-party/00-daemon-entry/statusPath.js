// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: statusPath  (minified: KR, daemon.pretty.js:32980)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function statusPath(e) {
    return Lae.join(e.registryDir, "status.json")
}
