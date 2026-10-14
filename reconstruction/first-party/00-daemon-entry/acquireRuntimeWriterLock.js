// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: acquireRuntimeWriterLock  (minified: pH, daemon.pretty.js:89305)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.8.0 (maps/history_daemon.json)
// locals: 11 renamed — 2 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function acquireRuntimeWriterLock(paths, options = {}) {
    let runtimeWriterLockPath = resolveRuntimeWriterLockPath(paths),
        now = options.now ?? new Date,
        ttlMs = options.ttlMs ?? 12e4,
        pid = options.pid ?? process.pid,
        lock = {
            runtime_dir: paths.runtimeDir,
            pid,
            boot_id: getCachedHostBootId(),
            started_at: now.toISOString(),
            last_heartbeat_at: now.toISOString()
        };
    await pS.mkdir(paths.runLocksDir, {
        recursive: !0
    });
    let tempPath = `${runtimeWriterLockPath}.${pid}-${Mct.randomUUID()}`,
        linked = !1;
    try {
        await writeJsonFileAtomic(tempPath, lock);
        try {
            await pS.link(tempPath, runtimeWriterLockPath), linked = !0
        } catch (err) {
            if (err.code !== "EEXIST") throw err
        }
    } finally {
        try {
            await pS.unlink(tempPath)
        } catch {}
    }
    if (linked) return {
        acquired: !0,
        stale: !1,
        lock,
        lockPath: runtimeWriterLockPath
    };
    let existingLock = await fH(runtimeWriterLockPath);
    return existingLock && !isRuntimeWriterLockStale(existingLock, now, ttlMs) ? {
        acquired: !1,
        stale: !1,
        lock: existingLock,
        lockPath: runtimeWriterLockPath
    } : (await writeJsonFileAtomic(runtimeWriterLockPath, lock), {
        acquired: !0,
        stale: !!existingLock,
        lock,
        lockPath: runtimeWriterLockPath
    })
}
