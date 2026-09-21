// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: Hlt, daemon.pretty.js:67679)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t, n, r) {
    let i = Mlt(e);
    if (i.readFault) return sO(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = Lve(t, o),
        u = Llt(a);
    if (u < vg && i.dates.includes(o)) {
        let d = zve(Cc.join(e, `${o}.jsonl`));
        if (d.readFault) return sO(null);
        let f = -1;
        for (let p of d.events) p.interaction && p.msOfDay > u && p.msOfDay > f && (f = p.msOfDay);
        if (f >= 0 && n - (s + f) >= r) {
            let p = {
                date: o,
                startMs: u,
                endMs: f
            };
            return O6(p, qve(Uve(d.events, p)))
        }
    }
    let l = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let f = i.dates[d];
        if (f >= o) continue;
        let p = Flt(f, Lve(t, f));
        if (p.length > 0) {
            l = p[p.length - 1];
            break
        }
    }
    if (l === null) return O6(null, []);
    let c = zve(Cc.join(e, `${l.date}.jsonl`));
    return c.readFault ? sO(l) : O6(l, qve(Uve(c.events, l)))
}
