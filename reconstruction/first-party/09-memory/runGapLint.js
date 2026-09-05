// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: Wtt, daemon.pretty.js:61232)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t, n, r) {
    let i = jtt(e);
    if (i.readFault) return OP(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = Uhe(t, o),
        l = Ftt(a);
    if (l < uh && i.dates.includes(o)) {
        let d = Bhe(Ku.join(e, `${o}.jsonl`));
        if (d.readFault) return OP(null);
        let p = -1;
        for (let f of d.events) f.interaction && f.msOfDay > l && f.msOfDay > p && (p = f.msOfDay);
        if (p >= 0 && n - (s + p) >= r) {
            let f = {
                date: o,
                startMs: l,
                endMs: p
            };
            return v4(f, Vhe(Hhe(d.events, f)))
        }
    }
    let u = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let p = i.dates[d];
        if (p >= o) continue;
        let f = ztt(p, Uhe(t, p));
        if (f.length > 0) {
            u = f[f.length - 1];
            break
        }
    }
    if (u === null) return v4(null, []);
    let c = Bhe(Ku.join(e, `${u.date}.jsonl`));
    return c.readFault ? OP(u) : v4(u, Vhe(Hhe(c.events, u)))
}
