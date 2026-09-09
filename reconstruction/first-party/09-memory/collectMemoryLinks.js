// duoduo reconstruction — subsystem: 09-memory
// symbol: collectMemoryLinks  (minified: ic, daemon.pretty.js:61009)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectMemoryLinks(e) {
    return t => {
        if (!B4(t)) return null;
        let n = vn(q4.join(e.topicsDir, `${t}.md`)),
            r = vn(q4.join(e.entitiesDir, `${t}.md`)),
            i = [];
        if (n !== null && i.push(n), r !== null && i.push(r), i.length > 0) {
            let o = vn(q4.join(e.effectivenessDir, `${t}.md`));
            o !== null && i.push(o)
        }
        return i.length > 0 ? i.join(`
`) : null
    }
}
