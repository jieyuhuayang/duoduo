// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: Fc, daemon.pretty.js:67153)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
    let n = new Set,
        r = resolveMemoryLinkTargets(e).filter(isSafeMemorySlug);
    for (let i of r) n.add(i);
    for (; r.length > 0;) {
        let i = new Set,
            o = [...r].sort(compareStringsAscending);
        for (let s of o) {
            let a = t(s);
            if (a !== null)
                for (let u of resolveMemoryLinkTargets(a)) isSafeMemorySlug(u) && !n.has(u) && i.add(u)
        }
        r = [...i];
        for (let s of r) n.add(s)
    }
    return n
}
