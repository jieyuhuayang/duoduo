// duoduo reconstruction — subsystem: 03-session-actor
// symbol: refreshSessionDrainLockHeartbeat  (minified: axe, daemon.pretty.js:70185)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshSessionDrainLockHeartbeat(e, t, n = new Date) {
    let r = resolveSessionDrainLockPath(e, t),
        i = await readDrainLockFile(r);
    i && (i.last_heartbeat_at = n.toISOString(), await writeJsonFileAtomic(r, i))
}
