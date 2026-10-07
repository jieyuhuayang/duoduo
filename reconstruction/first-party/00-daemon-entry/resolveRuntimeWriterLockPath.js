// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: resolveRuntimeWriterLockPath  (minified: cH, daemon.pretty.js:89212)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRuntimeWriterLockPath(e) {
    return Mct.join(e.runLocksDir, "daemon-writer.json")
}
