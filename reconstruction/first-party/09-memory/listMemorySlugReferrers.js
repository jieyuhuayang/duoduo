// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemorySlugReferrers  (minified: Nft, daemon.pretty.js:68780)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemorySlugReferrers(e, t) {
    let n = `[[${e}]]`,
        r = [],
        i = readMemoryFileSyncOrNull(t.boardPath);
    i !== null && i.includes(n) && r.push("CLAUDE.md");
    for (let [o, s] of [
            [t.entitiesDir, "entities"],
            [t.topicsDir, "topics"]
        ])
        for (let a of listMarkdownSlugsSync(o)) {
            if (a === e) continue;
            let u = readMemoryFileSyncOrNull(wS.join(o, `${a}.md`));
            u !== null && u.includes(n) && r.push(`${s}/${a}.md`)
        }
    return r.sort(compareStringsAscending), r
}
