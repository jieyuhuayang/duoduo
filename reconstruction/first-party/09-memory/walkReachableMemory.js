// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: dm, daemon.pretty.js:56354)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(fU);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            s = [...r].sort(Or);
        for (let o of s) {
            let a = t(o);
            if (a !== null)
                for (let c of resolveMemoryLinkTargets(a)) fU(c) && !n.has(c) && i.add(c)
        }
        r = [...i];
        for (let o of r) n.add(o)
    }
    return n
}
