// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: replaceSessionIndexEntry  (minified: lq, daemon.pretty.js:36932)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function replaceSessionIndexEntry(sessionIndex, sessionKey, runtimeState, meta) {
    let entry = Ret(sessionKey, runtimeState, meta);
    if (entry === null) {
        sessionIndex.remove(sessionKey);
        return
    }
    sessionIndex.remove(sessionKey), sessionIndex.upsert(entry)
}
