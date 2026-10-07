// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: Vdt, daemon.pretty.js:67967)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t, n, r) {
    let i = Ddt(e);
    if (i.readFault) return buildGapReadFaultResult(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = tSe(t, o),
        u = jdt(a);
    if (u < da && i.dates.includes(o)) {
        let d = readGapLintDayEvents(zc.join(e, `${o}.jsonl`));
        if (d.readFault) return buildGapReadFaultResult(null);
        let f = -1;
        for (let p of d.events) p.interaction && p.msOfDay > u && p.msOfDay > f && (f = p.msOfDay);
        if (f >= 0 && n - (s + f) >= r) {
            let p = {
                date: o,
                startMs: u,
                endMs: f
            };
            return AH(p, mergeContiguousHourRanges(iSe(d.events, p)))
        }
    }
    let l = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let f = i.dates[d];
        if (f >= o) continue;
        let p = Ldt(f, tSe(t, f));
        if (p.length > 0) {
            l = p[p.length - 1];
            break
        }
    }
    if (l === null) return AH(null, []);
    let c = readGapLintDayEvents(zc.join(e, `${l.date}.jsonl`));
    return c.readFault ? buildGapReadFaultResult(l) : AH(l, mergeContiguousHourRanges(iSe(c.events, l)))
}
