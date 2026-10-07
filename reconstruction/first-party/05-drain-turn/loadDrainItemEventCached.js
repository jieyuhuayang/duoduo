// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: loadDrainItemEventCached  (minified: Hxe, daemon.pretty.js:72146)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.5, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadDrainItemEventCached(e, t, n, r) {
    if (!t.eventId) return null;
    let i = t.eventId,
        o = n.get(i);
    if (o) return o;
    let s = t.createdAt ? {
            notAfter: t.createdAt
        } : void 0,
        a = await runTimedDrainPhase(r, "event_read_ms", async () => readEventById(e, i, s));
    return a ? (n.set(i, a), a) : null
}
