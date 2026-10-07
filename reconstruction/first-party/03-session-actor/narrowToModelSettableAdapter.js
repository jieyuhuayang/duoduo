// duoduo reconstruction — subsystem: 03-session-actor
// symbol: narrowToModelSettableAdapter  (minified: kG, daemon.pretty.js:82899)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function narrowToModelSettableAdapter(e) {
    if (!(!e || typeof e != "object" || typeof e.setModel != "function")) return e
}
