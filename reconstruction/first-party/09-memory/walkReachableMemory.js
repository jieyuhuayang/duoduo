// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: um, daemon.pretty.js:56232)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(uU);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            s = [...r].sort(Cr);
        for (let o of s) {
            let a = t(o);
            if (a !== null)
                for (let u of resolveMemoryLinkTargets(a)) uU(u) && !n.has(u) && i.add(u)
        }
        r = [...i];
        for (let o of r) n.add(o)
    }
    return n
}
