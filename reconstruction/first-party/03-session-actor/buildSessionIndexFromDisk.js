// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionIndexFromDisk  (minified: dh, daemon.pretty.js:36847)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
