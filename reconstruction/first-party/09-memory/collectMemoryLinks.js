// duoduo reconstruction — subsystem: 09-memory
// symbol: collectMemoryLinks  (minified: lm, daemon.pretty.js:56339)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectMemoryLinks(e) {
    return t => {
        if (!fU(t)) return null;
        let n = mr(dU.join(e.topicsDir, `${t}.md`)),
            r = mr(dU.join(e.entitiesDir, `${t}.md`)),
            i = [];
        if (n !== null && i.push(n), r !== null && i.push(r), i.length > 0) {
            let s = mr(dU.join(e.effectivenessDir, `${t}.md`));
            s !== null && i.push(s)
        }
        return i.length > 0 ? i.join(`
`) : null
    }
}
