// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isDirEmptyOrMissing  (minified: omt, daemon.pretty.js:69751)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isDirEmptyOrMissing(dirPath) {
    try {
        return (await or.readdir(dirPath)).length === 0
    } catch (err) {
        if (err.code === "ENOENT") return !0;
        throw err
    }
}
