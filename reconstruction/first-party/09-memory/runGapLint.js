// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: Ert, daemon.pretty.js:61819)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t, n, r) {
    let i = grt(e);
    if (i.readFault) return KP(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = Dge(t, o),
        l = _rt(a);
    if (l < wh && i.dates.includes(o)) {
        let d = jge(sc.join(e, `${o}.jsonl`));
        if (d.readFault) return KP(null);
        let p = -1;
        for (let f of d.events) f.interaction && f.msOfDay > l && f.msOfDay > p && (p = f.msOfDay);
        if (p >= 0 && n - (s + p) >= r) {
            let f = {
                date: o,
                startMs: l,
                endMs: p
            };
            return X4(f, Fge(Lge(d.events, f)))
        }
    }
    let u = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let p = i.dates[d];
        if (p >= o) continue;
        let f = brt(p, Dge(t, p));
        if (f.length > 0) {
            u = f[f.length - 1];
            break
        }
    }
    if (u === null) return X4(null, []);
    let c = jge(sc.join(e, `${u.date}.jsonl`));
    return c.readFault ? KP(u) : X4(u, Fge(Lge(c.events, u)))
}
