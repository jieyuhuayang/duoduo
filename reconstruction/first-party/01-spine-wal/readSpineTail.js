// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readSpineTail  (minified: rve, daemon.pretty.js:89023)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSpineTail(e, t, n = new Date) {
    let r = Math.min(Math.max(t?.limit ?? 200, 1), 500),
        i = t?.after_id,
        o = await readPartitionTail(e, `${n.toISOString().slice(0,10)}.jsonl`, r, i);
    if (!i || o.foundCursor || o.has_more) return {
        events: o.events,
        has_more: o.has_more
    };
    let s = new Date(n);
    s.setUTCDate(s.getUTCDate() - 1);
    let a = await readPartitionTail(e, `${s.toISOString().slice(0,10)}.jsonl`, r - o.events.length, i, !0);
    return a.foundCursor ? {
        events: [...a.events, ...o.events],
        has_more: a.has_more
    } : {
        events: o.events,
        has_more: o.has_more
    }
}
