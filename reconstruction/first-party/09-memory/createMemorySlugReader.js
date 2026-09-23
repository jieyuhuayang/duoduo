// duoduo reconstruction — subsystem: 09-memory
// symbol: createMemorySlugReader  (minified: Tc, daemon.pretty.js:66866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMemorySlugReader(e) {
    return t => {
        if (!x6(t)) return null;
        let n = Rn(k6.join(e.topicsDir, `${t}.md`)),
            r = Rn(k6.join(e.entitiesDir, `${t}.md`)),
            i = [];
        if (n !== null && i.push(n), r !== null && i.push(r), i.length > 0) {
            let o = Rn(k6.join(e.effectivenessDir, `${t}.md`));
            o !== null && i.push(o)
        }
        return i.length > 0 ? i.join(`
`) : null
    }
}
