// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: Ym, daemon.pretty.js:57586)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(s2);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            o = [...r].sort(Br);
        for (let s of o) {
            let a = t(s);
            if (a !== null)
                for (let l of resolveMemoryLinkTargets(a)) s2(l) && !n.has(l) && i.add(l)
        }
        r = [...i];
        for (let s of r) n.add(s)
    }
    return n
}
