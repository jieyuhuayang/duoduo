// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isStaleIdleCompactEvent  (minified: rht, daemon.pretty.js:72351)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isStaleIdleCompactEvent(e, t) {
    if (!e) return !1;
    let n = Date.parse(e);
    return Number.isNaN(n) ? !1 : typeof t.actorSpawnedAt == "number" && n < t.actorSpawnedAt || typeof t.actorLastTurnCompletedAt == "number" && t.actorLastTurnCompletedAt > n
}
