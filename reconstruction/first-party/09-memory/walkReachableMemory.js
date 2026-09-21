// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: Pc, daemon.pretty.js:66884)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(k6);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            o = [...r].sort(Pr);
        for (let s of o) {
            let a = t(s);
            if (a !== null)
                for (let u of resolveMemoryLinkTargets(a)) k6(u) && !n.has(u) && i.add(u)
        }
        r = [...i];
        for (let s of r) n.add(s)
    }
    return n
}
