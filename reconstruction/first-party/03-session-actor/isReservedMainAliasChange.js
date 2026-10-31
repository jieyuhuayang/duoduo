// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isReservedMainAliasChange  (minified: cv, daemon.pretty.js:36799)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isReservedMainAliasChange(e, t, n) {
    return classifySessionKeyKind(e) !== "channel" ? !1 : t?.trim() === Hn || n?.trim() === Hn
}
