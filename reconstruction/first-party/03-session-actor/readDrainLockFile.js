// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readDrainLockFile  (minified: lxe, daemon.pretty.js:70205)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.4, v0.3.5 (maps/history_daemon.json)
// changelog v0.3.5 (medium): **runner**: Keep session lock heartbeat and release ownership inside the active drain so actors that never acquired the lock cannot renew or delete it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainLockFile(e) {
    try {
        let t = await oxe.readFile(e, "utf8");
        return JSON.parse(t)
    } catch {
        return null
    }
}
