// duoduo reconstruction — subsystem: 03-session-actor
// symbol: diffStreamingConfigSignature  (minified: $A, daemon.pretty.js:82364)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function diffStreamingConfigSignature(e, t) {
    let n = u => {
            try {
                return JSON.parse(u)
            } catch {
                return {}
            }
        },
        r = n(e),
        i = n(t),
        o = new Set([...Object.keys(r), ...Object.keys(i)]),
        s = u => {
            let l = typeof u == "string" ? u : JSON.stringify(u) ?? "undefined";
            return l.length > 48 ? `${l.slice(0,48)}…` : l
        },
        a = [];
    for (let u of o) {
        let l = r[u],
            c = i[u];
        if (JSON.stringify(l) !== JSON.stringify(c))
            if (Array.isArray(l) || Array.isArray(c)) {
                let d = Array.isArray(l) ? l : [],
                    f = Array.isArray(c) ? c : [],
                    p = new Set(d.map(y => JSON.stringify(y))),
                    m = new Set(f.map(y => JSON.stringify(y))),
                    h = [...m].filter(y => !p.has(y)).length,
                    g = [...p].filter(y => !m.has(y)).length;
                a.push(`${u}: len ${d.length}→${f.length} (+${h}/-${g})`)
            } else a.push(`${u}: ${s(l)} → ${s(c)}`)
    }
    return a
}
