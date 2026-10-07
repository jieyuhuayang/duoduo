// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readDrainLockFile  (minified: lxe, daemon.pretty.js:70205)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
