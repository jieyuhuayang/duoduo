// duoduo reconstruction — subsystem: 09-memory
// symbol: isPlainJsonObject  (minified: dke, daemon.pretty.js:68760)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isPlainJsonObject(e) {
    return typeof e == "object" && e !== null && !Array.isArray(e)
}
