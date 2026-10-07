// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: coerceToPlainObject  (minified: Oi, daemon.pretty.js:63322)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function coerceToPlainObject(e) {
    return e && typeof e == "object" && !Array.isArray(e) ? e : {}
}
