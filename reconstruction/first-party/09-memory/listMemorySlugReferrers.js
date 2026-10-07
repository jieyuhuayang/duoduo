// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemorySlugReferrers  (minified: Nft, daemon.pretty.js:68780)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemorySlugReferrers(e, t) {
    let n = `[[${e}]]`,
        r = [],
        i = Tn(t.boardPath);
    i !== null && i.includes(n) && r.push("CLAUDE.md");
    for (let [o, s] of [
            [t.entitiesDir, "entities"],
            [t.topicsDir, "topics"]
        ])
        for (let a of ou(o)) {
            if (a === e) continue;
            let u = Tn(wS.join(o, `${a}.md`));
            u !== null && u.includes(n) && r.push(`${s}/${a}.md`)
        }
    return r.sort(Ar), r
}
