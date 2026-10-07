// duoduo reconstruction — subsystem: 09-memory
// symbol: readMemoryFileSyncOrNull  (minified: Tn, daemon.pretty.js:66841)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readMemoryFileSyncOrNull(e) {
    try {
        return CO.readFileSync(e, "utf8")
    } catch (t) {
        return recordUnreadableMemoryPath(t), null
    }
}
