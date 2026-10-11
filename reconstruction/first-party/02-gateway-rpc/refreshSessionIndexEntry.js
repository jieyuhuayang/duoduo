// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: refreshSessionIndexEntry  (minified: kIe, daemon.pretty.js:90915)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (medium): give a session a human label so it is legible in `list`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshSessionIndexEntry(paths, sessionIndex, sessionKey) {
    let [runtimeState, sessionMeta] = await Promise.all([readSessionRuntimeState(paths, sessionKey), readSessionMetaFile(paths, sessionKey)]);
    replaceSessionIndexEntry(sessionIndex, sessionKey, runtimeState, sessionMeta)
}
