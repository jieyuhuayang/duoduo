// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readDrainLockFile  (minified: IEe, daemon.pretty.js:71404)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.4, v0.3.5 (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.5 (medium): **runner**: Keep session lock heartbeat and release ownership inside the active drain so actors that never acquired the lock cannot renew or delete it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainLockFile(lockPath) {
    try {
        let content = await kEe.readFile(lockPath, "utf8");
        return JSON.parse(content)
    } catch {
        return null
    }
}
