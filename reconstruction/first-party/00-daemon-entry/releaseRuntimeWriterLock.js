// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: releaseRuntimeWriterLock  (minified: EO, daemon.pretty.js:89312)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function releaseRuntimeWriterLock(e) {
    let t = resolveRuntimeWriterLockPath(e);
    try {
        let n = await dH(t);
        if (n && n.pid !== process.pid) return;
        await pS.unlink(t)
    } catch {}
}
