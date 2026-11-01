// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderForOwnerAttribute  (minified: uJ, daemon.pretty.js:72963)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderForOwnerAttribute(e) {
    return e?.owner ? `for_owner="${escapeXmlText(e.owner)}"` : ""
}
