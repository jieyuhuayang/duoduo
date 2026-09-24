// duoduo reconstruction — subsystem: 09-memory
// symbol: computeOrphanTopicNodes  (minified: Dct, daemon.pretty.js:68320)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeOrphanTopicNodes(e, t = {}) {
    let n = resolveMemoryDirs(e);
    if (!vg(n.memoryDir) || !Ic(n.boardPath)) return {
        missing: !0,
        seeds: 0,
        reached: 0,
        universe: 0,
        keep: [],
        orphans: []
    };
    let r = Rn(n.boardPath) ?? "",
        i = resolveMemoryLinkTargets(r),
        o = walkReachableMemory(r, t.resolve ?? createMemorySlugReader(n)),
        s = computeMemoryLinkIndegree(n),
        a = [],
        u = [];
    for (let l of Ka(n.topicsDir)) {
        if (t.filter && !l.startsWith(t.filter)) continue;
        if (o.has(l)) {
            a.push(l);
            continue
        }
        let c = Zw.join(n.topicsDir, `${l}.md`),
            d = Rn(c) ?? "",
            f = 0;
        try {
            f = mwe.statSync(c).mtimeMs
        } catch {
            f = 0
        }
        u.push({
            slug: l,
            rel: `topics/${l}.md`,
            kb: K$(X$(d)),
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
