// duoduo reconstruction — subsystem: 09-memory
// symbol: computeMemoryLinkIndegree  (minified: Lct, daemon.pretty.js:68478)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeMemoryLinkIndegree(e) {
    let t = new Map;
    for (let n of [e.entitiesDir, e.topicsDir])
        for (let r of Ka(n)) {
            let i = Rn(Zw.join(n, `${r}.md`));
            if (i !== null)
                for (let o of scanWikiLinkOccurrences(i)) o.slug !== r && t.set(o.slug, (t.get(o.slug) ?? 0) + 1)
        }
    return t
}
