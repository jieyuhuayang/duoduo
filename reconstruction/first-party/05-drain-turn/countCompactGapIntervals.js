// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: countCompactGapIntervals  (minified: Axe, daemon.pretty.js:72356)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function countCompactGapIntervals(e, t, n) {
    let r = n ? new Date(n) : void 0,
        i;
    try {
        i = await readDrainRecords(e, t, r)
    } catch (u) {
        return logWarnMessage("[runner] compact_stats: G gap counts unavailable (ledger read failed)", {
            sessionKey: t,
            error: u instanceof Error ? u.message : String(u)
        }), {}
    }
    let o = i.map(u => new Date(u.drain_started_at).getTime()).filter(u => Number.isFinite(u)).sort((u, l) => u - l),
        s = 0,
        a = 0;
    for (let u = 1; u < o.length; u++) {
        let l = o[u] - o[u - 1];
        l > iht ? s += 1 : l >= oht && (a += 1)
    }
    return {
        g_gt1h_since_prev_compact: s,
        g_5m1h_since_prev_compact: a
    }
}
