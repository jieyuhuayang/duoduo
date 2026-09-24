// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: acquireRuntimeWriterLock  (minified: p6, daemon.pretty.js:88878)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function acquireRuntimeWriterLock(e, t = {}) {
    let n = resolveRuntimeWriterLockPath(e),
        r = t.now ?? new Date,
        i = t.ttlMs ?? 12e4,
        o = t.pid ?? process.pid,
        s = {
            runtime_dir: e.runtimeDir,
            pid: o,
            boot_id: getCachedHostBootId(),
            started_at: r.toISOString(),
            last_heartbeat_at: r.toISOString()
        };
    await Uw.mkdir(e.runLocksDir, {
        recursive: !0
    });
    let a = `${n}.${o}-${Fut.randomUUID()}`,
        u = !1;
    try {
        await Bt(a, s);
        try {
            await Uw.link(a, n), u = !0
        } catch (c) {
            if (c.code !== "EEXIST") throw c
        }
    } finally {
        try {
            await Uw.unlink(a)
        } catch {}
    }
    if (u) return {
        acquired: !0,
        stale: !1,
        lock: s,
        lockPath: n
    };
    let l = await f6(n);
    return l && !isRuntimeWriterLockStale(l, r, i) ? {
        acquired: !1,
        stale: !1,
        lock: l,
        lockPath: n
    } : (await Bt(n, s), {
        acquired: !0,
        stale: !!l,
        lock: s,
        lockPath: n
    })
}
