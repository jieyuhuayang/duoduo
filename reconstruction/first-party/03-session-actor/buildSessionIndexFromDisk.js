// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionIndexFromDisk  (minified: dh, daemon.pretty.js:36847)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (high): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json` (completes Phase 3 of session-state-refactor; `var/registry/sessions/` is no longer read on the hot path
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function buildSessionIndexFromDisk(e) {
    let t = new Map,
        n = await readAllSessionStateFiles(e);
    for (let [r, i] of Object.entries(n)) {
        let o = await readSessionMetaFile(e, r);
        t.set(r, buildSessionIndexEntry(r, i, o))
    }
    return createMapBackedSessionIndex(t)
}
