// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSessionsWithRecentConsumer  (minified: $lt, daemon.pretty.js:64793)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (medium): now fails with a message naming the sessions that *do* have a reader
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionsWithRecentConsumer(e, t, n = Date.now(), r = resolveNotifyUnconsumedHours()) {
    let i = r * nO,
        o = await buildSessionIndexFromDisk(e),
        s = [];
    for (let a of o.listByKind("channel")) {
        if (a.session_key === t) continue;
        let u = await readLatestDeliveryCursorUpdate(e, a.session_key);
        if (u === void 0) continue;
        let l = Date.parse(u);
        if (!Number.isFinite(l)) continue;
        let c = Math.max(n - l, 0);
        c > i || s.push({
            session_key: a.session_key,
            display_name: a.display_name,
            age_ms: c
        })
    }
    return s.sort((a, u) => a.age_ms - u.age_ms || a.session_key.localeCompare(u.session_key))
}
