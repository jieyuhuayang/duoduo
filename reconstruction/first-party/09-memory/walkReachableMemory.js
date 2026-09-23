// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: Pc, daemon.pretty.js:66881)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(x6);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            o = [...r].sort(Tr);
        for (let s of o) {
            let a = t(s);
            if (a !== null)
                for (let u of resolveMemoryLinkTargets(a)) x6(u) && !n.has(u) && i.add(u)
        }
        r = [...i];
        for (let s of r) n.add(s)
    }
    return n
}
