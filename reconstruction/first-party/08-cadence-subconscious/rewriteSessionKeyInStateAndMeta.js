// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: rewriteSessionKeyInStateAndMeta  (minified: Wpt, daemon.pretty.js:69357)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rewriteSessionKeyInStateAndMeta(paths, oldSessionKey, newSessionKey) {
    let sessionStatePath = resolveSessionStatePath(paths, oldSessionKey),
        sessionMetaPath = resolveSessionMetaPath(paths, oldSessionKey),
        stateSource = await jke(sessionStatePath),
        metaSource = await jke(sessionMetaPath),
        state = stateSource === null ? null : JSON.parse(stateSource),
        meta = metaSource === null ? null : (0, sA.default)(metaSource);
    state && state.session_key !== newSessionKey && (state.session_key = newSessionKey, await writeJsonFileAtomic(sessionStatePath, state)), meta && meta.data.session_key !== newSessionKey && (meta.data.session_key = newSessionKey, await writeFileAtomic(sessionMetaPath, sA.default.stringify(meta.content, meta.data)))
}
