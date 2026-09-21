// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryLinkTargets  (minified: Ff, daemon.pretty.js:66521)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryLinkTargets(e) {
    let t = new Set;
    for (let n of Lf(e)) t.add(n.slug);
    return [...t].sort(Pr)
}
