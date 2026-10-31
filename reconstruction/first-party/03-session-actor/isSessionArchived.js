// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isSessionArchived  (minified: zo, daemon.pretty.js:33574)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionArchived(paths, sessionKey) {
    return Vue(resolveArchivedSessionDir(paths, sessionKey)) && !Vue(resolveSessionDir(paths, sessionKey))
}
