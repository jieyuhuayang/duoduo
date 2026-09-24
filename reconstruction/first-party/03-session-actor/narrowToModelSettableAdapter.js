// duoduo reconstruction — subsystem: 03-session-actor
// symbol: narrowToModelSettableAdapter  (minified: dJ, daemon.pretty.js:82597)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function narrowToModelSettableAdapter(e) {
    if (!(!e || typeof e != "object" || typeof e.setModel != "function")) return e
}
