// duoduo reconstruction — subsystem: 03-session-actor
// symbol: notifySessionFileChanged  (minified: eh, daemon.pretty.js:35572)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function notifySessionFileChanged(sessionKey, fileKind) {
    let listener = bce;
    if (listener) try {
        listener(sessionKey, fileKind)
    } catch {}
}
