// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractSessionKeyChannelKind  (minified: r_t, daemon.pretty.js:74744)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractSessionKeyChannelKind(e) {
    let t = e.indexOf(":");
    return t <= 0 ? "unknown" : e.slice(0, t)
}
