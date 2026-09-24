// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: pruneEventIdIndexByRetention  (minified: sse, daemon.pretty.js:32179)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function pruneEventIdIndexByRetention(e, t) {
    let n = t.now ?? new Date,
        r = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() - t.retentionDays)),
        i = formatEventPartitionName(r),
        o = resolveEventIdIndexPath(e),
        s = [],
        a = 0;
    try {
        let l = hz(o);
        for await (let c of ds(l)) {
            if (!c) continue;
            let d;
            try {
                d = JSON.parse(c).partition
            } catch {
                a += 1;
                continue
            }
            typeof d == "string" && d >= i ? s.push(c) : a += 1
        }
    } catch (l) {
        if (l.code === "ENOENT") return {
            kept: 0,
            dropped: 0,
            cutoff: i
        };
        throw l
    }
    if (a === 0) return {
        kept: s.length,
        dropped: a,
        cutoff: i
    };
    let u = s.length === 0 ? "" : `${s.join(`
`)}
`;
    return await Dt(o, u), {
        kept: s.length,
        dropped: a,
        cutoff: i
    }
}
