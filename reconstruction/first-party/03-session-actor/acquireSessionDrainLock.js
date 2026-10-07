// duoduo reconstruction — subsystem: 03-session-actor
// symbol: acquireSessionDrainLock  (minified: sxe, daemon.pretty.js:70162)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function acquireSessionDrainLock(e, t, n = {}) {
    let r = resolveSessionDrainLockPath(e, t),
        i = n.now ?? new Date,
        o = n.ttlMs ?? 12e4,
        s = n.pid ?? process.pid,
        a = await readDrainLockFile(r);
    if (a && !vmt(a, i, o)) return {
        acquired: !1,
        stale: !1,
        lock: a
    };
    let u = {
        session_ref: t,
        pid: s,
        started_at: i.toISOString(),
        last_heartbeat_at: i.toISOString()
    };
    return await writeJsonFileAtomic(r, u), {
        acquired: !0,
        stale: !!a,
        lock: u
    }
}
