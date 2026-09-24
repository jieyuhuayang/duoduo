// duoduo reconstruction — subsystem: 03-session-actor
// symbol: refreshSessionDrainLockHeartbeat  (minified: ySe, daemon.pretty.js:69894)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function refreshSessionDrainLockHeartbeat(e, t, n = new Date) {
    let r = fH(e, t),
        i = await bSe(r);
    i && (i.last_heartbeat_at = n.toISOString(), await Bt(r, i))
}
