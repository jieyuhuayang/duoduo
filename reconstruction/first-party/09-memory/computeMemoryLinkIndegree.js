// duoduo reconstruction — subsystem: 09-memory
// symbol: computeMemoryLinkIndegree  (minified: Cgt, daemon.pretty.js:70852)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 2 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeMemoryLinkIndegree(memoryDirs) {
    let map = new Map;
    for (let dir of [memoryDirs.entitiesDir, memoryDirs.topicsDir])
        for (let slug of listMarkdownSlugsSync(dir)) {
            let memoryFile = readMemoryFileSyncOrNull(AS.join(dir, `${slug}.md`));
            if (memoryFile !== null)
                for (let occurrence of scanWikiLinkOccurrences(memoryFile)) occurrence.slug !== slug && map.set(occurrence.slug, (map.get(occurrence.slug) ?? 0) + 1)
        }
    return map
}
