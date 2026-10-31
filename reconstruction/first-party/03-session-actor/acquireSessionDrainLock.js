// duoduo reconstruction — subsystem: 03-session-actor
// symbol: acquireSessionDrainLock  (minified: xEe, daemon.pretty.js:71361)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.4, v0.3.5 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.5 (medium): **runner**: Keep session lock heartbeat and release ownership inside the active drain so actors that never acquired the lock cannot renew or delete it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function acquireSessionDrainLock(paths, sessionRef, options = {}) {
    let sessionDrainLockPath = resolveSessionDrainLockPath(paths, sessionRef),
        now = options.now ?? new Date,
        ttlMs = options.ttlMs ?? 12e4,
        pid = options.pid ?? process.pid,
        drainLockFile = await readDrainLockFile(sessionDrainLockPath);
    if (drainLockFile && !zgt(drainLockFile, now, ttlMs)) return {
        acquired: !1,
        stale: !1,
        lock: drainLockFile
    };
    let lock = {
        session_ref: sessionRef,
        pid,
        started_at: now.toISOString(),
        last_heartbeat_at: now.toISOString()
    };
    return await writeJsonFileAtomic(sessionDrainLockPath, lock), {
        acquired: !0,
        stale: !!drainLockFile,
        lock
    }
}
