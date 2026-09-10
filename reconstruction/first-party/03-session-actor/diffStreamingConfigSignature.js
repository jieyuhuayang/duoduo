// duoduo reconstruction — subsystem: 03-session-actor
// symbol: diffStreamingConfigSignature  (minified: wO, daemon.pretty.js:76390)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function diffStreamingConfigSignature(e, t) {
    let n = l => {
            try {
                return JSON.parse(l)
            } catch {
                return {}
            }
        },
        r = n(e),
        i = n(t),
        o = new Set([...Object.keys(r), ...Object.keys(i)]),
        s = l => {
            let u = typeof l == "string" ? l : JSON.stringify(l) ?? "undefined";
            return u.length > 48 ? `${u.slice(0,48)}…` : u
        },
        a = [];
    for (let l of o) {
        let u = r[l],
            c = i[l];
        if (JSON.stringify(u) !== JSON.stringify(c))
            if (Array.isArray(u) || Array.isArray(c)) {
                let d = Array.isArray(u) ? u : [],
                    p = Array.isArray(c) ? c : [],
                    f = new Set(d.map(y => JSON.stringify(y))),
                    m = new Set(p.map(y => JSON.stringify(y))),
                    h = [...m].filter(y => !f.has(y)).length,
                    g = [...f].filter(y => !m.has(y)).length;
                a.push(`${l}: len ${d.length}→${p.length} (+${h}/-${g})`)
            } else a.push(`${l}: ${s(u)} → ${s(c)}`)
    }
    return a
}
