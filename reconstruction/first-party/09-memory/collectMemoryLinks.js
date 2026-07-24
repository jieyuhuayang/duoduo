// duoduo reconstruction — subsystem: 09-memory
// symbol: collectMemoryLinks  (minified: am, daemon.pretty.js:56217)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectMemoryLinks(e) {
    return t => {
        if (!uU(t)) return null;
        let n = gr(aU.join(e.topicsDir, `${t}.md`)),
            r = gr(aU.join(e.entitiesDir, `${t}.md`)),
            i = [];
        if (n !== null && i.push(n), r !== null && i.push(r), i.length > 0) {
            let s = gr(aU.join(e.effectivenessDir, `${t}.md`));
            s !== null && i.push(s)
        }
        return i.length > 0 ? i.join(`
`) : null
    }
}
