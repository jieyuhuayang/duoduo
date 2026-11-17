// duoduo reconstruction — subsystem: 09-memory
// symbol: escapeRegExpSource  (minified: Xke, daemon.pretty.js:69572)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function escapeRegExpSource(e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
