// duoduo reconstruction — subsystem: 09-memory
// symbol: computeOrphanTopicNodes  (minified: $ft, daemon.pretty.js:68611)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 13 renamed — 3 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeOrphanTopicNodes(memoryDir, options = {}) {
    let memoryDirs = resolveMemoryDirs(memoryDir);
    if (!isMemoryPathDirectory(memoryDirs.memoryDir) || !isMemoryPathFile(memoryDirs.boardPath)) return {
        missing: !0,
        seeds: 0,
        reached: 0,
        universe: 0,
        keep: [],
        orphans: []
    };
    let boardText = readMemoryFileSyncOrNull(memoryDirs.boardPath) ?? "",
        memoryLinkTargets = resolveMemoryLinkTargets(boardText),
        reachable = walkReachableMemory(boardText, options.resolve ?? createMemorySlugReader(memoryDirs)),
        memoryLinkIndegree = computeMemoryLinkIndegree(memoryDirs),
        keep = [],
        orphans = [];
    for (let slug of listMarkdownSlugsSync(memoryDirs.topicsDir)) {
        if (options.filter && !slug.startsWith(options.filter)) continue;
        if (reachable.has(slug)) {
            keep.push(slug);
            continue
        }
        let topicPath = wS.join(memoryDirs.topicsDir, `${slug}.md`),
            content = readMemoryFileSyncOrNull(topicPath) ?? "",
            mtimeMs = 0;
        try {
            mtimeMs = $Se.statSync(topicPath).mtimeMs
        } catch {
            mtimeMs = 0
        }
        orphans.push({
            slug,
            rel: `topics/${slug}.md`,
            kb: bytesToKibCeil(measureUtf8ByteLength(content)),
            mtimeMs,
            indeg: memoryLinkIndegree.get(slug) ?? 0,
            referencedBy: listMemorySlugReferrers(slug, memoryDirs)
        })
    }
    return {
        missing: !1,
        seeds: memoryLinkTargets.length,
        reached: reachable.size,
        universe: keep.length + orphans.length,
        keep,
        orphans
    }
}
