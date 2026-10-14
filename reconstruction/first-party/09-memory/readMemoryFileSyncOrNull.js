// duoduo reconstruction — subsystem: 09-memory
// symbol: readMemoryFileSyncOrNull  (minified: Tn, daemon.pretty.js:66842)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readMemoryFileSyncOrNull(filePath) {
    try {
        return CO.readFileSync(filePath, "utf8")
    } catch (err) {
        return recordUnreadableMemoryPath(err), null
    }
}
