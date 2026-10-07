// duoduo reconstruction — subsystem: 09-memory
// symbol: computeOrphanTopicNodes  (minified: $ft, daemon.pretty.js:68611)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeOrphanTopicNodes(e, t = {}) {
    let n = resolveMemoryDirs(e);
    if (!isMemoryPathDirectory(n.memoryDir) || !isMemoryPathFile(n.boardPath)) return {
        missing: !0,
        seeds: 0,
        reached: 0,
        universe: 0,
        keep: [],
        orphans: []
    };
    let r = readMemoryFileSyncOrNull(n.boardPath) ?? "",
        i = resolveMemoryLinkTargets(r),
        o = walkReachableMemory(r, t.resolve ?? createMemorySlugReader(n)),
        s = computeMemoryLinkIndegree(n),
        a = [],
        u = [];
    for (let l of listMarkdownSlugsSync(n.topicsDir)) {
        if (t.filter && !l.startsWith(t.filter)) continue;
        if (o.has(l)) {
            a.push(l);
            continue
        }
        let c = wS.join(n.topicsDir, `${l}.md`),
            d = readMemoryFileSyncOrNull(c) ?? "",
            f = 0;
        try {
            f = $Se.statSync(c).mtimeMs
        } catch {
            f = 0
        }
        u.push({
            slug: l,
            rel: `topics/${l}.md`,
            kb: bytesToKibCeil(measureUtf8ByteLength(d)),
            mtimeMs: f,
            indeg: s.get(l) ?? 0,
            referencedBy: listMemorySlugReferrers(l, n)
        })
    }
    return {
        missing: !1,
        seeds: i.length,
        reached: o.size,
        universe: a.length + u.length,
        keep: a,
        orphans: u
    }
}
