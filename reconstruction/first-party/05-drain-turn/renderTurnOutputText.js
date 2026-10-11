// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderTurnOutputText  (minified: Oxe, daemon.pretty.js:72341)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderTurnOutputText(e, t) {
    return t.text ? t.text : t.structured !== void 0 ? JSON.stringify(t.structured) : ""
}
