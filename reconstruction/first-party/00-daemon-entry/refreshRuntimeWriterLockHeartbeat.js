// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: refreshRuntimeWriterLockHeartbeat  (minified: bwe, daemon.pretty.js:89307)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshRuntimeWriterLockHeartbeat(e, t = new Date) {
    let n = resolveRuntimeWriterLockPath(e),
        r = await dH(n);
    !r || r.pid !== process.pid || (r.last_heartbeat_at = t.toISOString(), await writeJsonFileAtomic(n, r))
}
