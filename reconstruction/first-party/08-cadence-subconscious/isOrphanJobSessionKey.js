// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOrphanJobSessionKey  (minified: fve, daemon.pretty.js:65292)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOrphanJobSessionKey(e, t) {
    return t !== null && e.startsWith("job:") && !t.has(e)
}
