// duoduo reconstruction — subsystem: 09-memory
// symbol: isMemoryPathFile  (minified: jc, daemon.pretty.js:66849)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.7.1 (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMemoryPathFile(filePath) {
    try {
        return CO.statSync(filePath).isFile()
    } catch (err) {
        return recordUnreadableMemoryPath(err), !1
    }
}
