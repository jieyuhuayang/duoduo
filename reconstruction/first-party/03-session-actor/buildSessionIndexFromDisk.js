// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionIndexFromDisk  (minified: bh, daemon.pretty.js:38929)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 3 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json` (completes Phase 3 of session-state-refactor; `var/registry/sessions/` is no longer read on the hot path
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function buildSessionIndexFromDisk(paths) {
    let map = new Map,
        allSessionStateFiles = await readAllSessionStateFiles(paths);
    for (let [sessionKey, state] of Object.entries(allSessionStateFiles)) {
        let sessionMetaFile = await readSessionMetaFile(paths, sessionKey);
        map.set(sessionKey, buildSessionIndexEntry(sessionKey, state, sessionMetaFile))
    }
    return createMapBackedSessionIndex(map)
}
