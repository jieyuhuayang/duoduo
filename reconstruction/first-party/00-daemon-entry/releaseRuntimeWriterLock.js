// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: releaseRuntimeWriterLock  (minified: EO, daemon.pretty.js:89358)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function releaseRuntimeWriterLock(paths) {
    let runtimeWriterLockPath = resolveRuntimeWriterLockPath(paths);
    try {
        let lock = await fH(runtimeWriterLockPath);
        if (lock && lock.pid !== process.pid) return;
        await pS.unlink(runtimeWriterLockPath)
    } catch {}
}
