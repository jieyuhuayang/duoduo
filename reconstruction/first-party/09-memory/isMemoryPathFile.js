// duoduo reconstruction — subsystem: 09-memory
// symbol: isMemoryPathFile  (minified: jc, daemon.pretty.js:66849)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMemoryPathFile(e) {
    try {
        return CO.statSync(e).isFile()
    } catch (t) {
        return recordUnreadableMemoryPath(t), !1
    }
}
