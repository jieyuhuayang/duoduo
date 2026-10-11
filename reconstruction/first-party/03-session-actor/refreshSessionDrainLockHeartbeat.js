// duoduo reconstruction — subsystem: 03-session-actor
// symbol: refreshSessionDrainLockHeartbeat  (minified: axe, daemon.pretty.js:70185)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshSessionDrainLockHeartbeat(paths, sessionRef, now = new Date) {
    let sessionDrainLockPath = resolveSessionDrainLockPath(paths, sessionRef),
        drainLockFile = await readDrainLockFile(sessionDrainLockPath);
    drainLockFile && (drainLockFile.last_heartbeat_at = now.toISOString(), await writeJsonFileAtomic(sessionDrainLockPath, drainLockFile))
}
