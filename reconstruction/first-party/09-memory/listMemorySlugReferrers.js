// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemorySlugReferrers  (minified: Nft, daemon.pretty.js:68780)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemorySlugReferrers(slug, memoryDirs) {
    let needle = `[[${slug}]]`,
        referrers = [],
        memoryFile = readMemoryFileSyncOrNull(memoryDirs.boardPath);
    memoryFile !== null && memoryFile.includes(needle) && referrers.push("CLAUDE.md");
    for (let [dir, tree] of [
            [memoryDirs.entitiesDir, "entities"],
            [memoryDirs.topicsDir, "topics"]
        ])
        for (let otherSlug of listMarkdownSlugsSync(dir)) {
            if (otherSlug === slug) continue;
            let memoryFile = readMemoryFileSyncOrNull(wS.join(dir, `${otherSlug}.md`));
            memoryFile !== null && memoryFile.includes(needle) && referrers.push(`${tree}/${otherSlug}.md`)
        }
    return referrers.sort(compareStringsAscending), referrers
}
