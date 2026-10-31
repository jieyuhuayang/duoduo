// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: isOrphanJobSessionKey  (minified: Iwe, daemon.pretty.js:66587)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isOrphanJobSessionKey(sessionKey, activeJobSessionKeys) {
    return activeJobSessionKeys !== null && sessionKey.startsWith("job:") && !activeJobSessionKeys.has(sessionKey)
}
