// duoduo reconstruction — subsystem: 09-memory
// symbol: runNodeLint  (minified: xve, daemon.pretty.js:67009)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runNodeLint(e, t = 1, n) {
    let r = resolveMemoryDirs(e);
    if (!vg(r.topicsDir)) return {
        ranked: [],
        selected: [],
        topicsDirMissing: !0
    };
    let i = Rn(r.boardPath) ?? "",
        o = walkReachableMemory(i, createMemorySlugReader(r)),
        s = [];
    for (let l of Ka(r.topicsDir)) {
        let c = Elt(l);
        if (c === null) continue;
        let d = l.slice(`${c}-`.length),
            f = Rn(wlt.join(r.topicsDir, `${l}.md`));
        if (f === null) continue;
        let p = klt(f, c),
            m = Y$(f);
        if (p.length === 0 && m <= E6) continue;
        let h = o.has(l);
        s.push({
            slug: d,
            type: c,
            lines: m,
            unexpectedSections: p,
            unexpectedSectionCount: p.length,
            reachable: h,
            escalated: !h
        })
    }
    s.sort(Rlt);
    let u = (Number.isFinite(t) && t > 0 ? s.slice(0, t) : []).map(l => ({
        row: l,
        kind: Un.NODE_CONVERGE,
        partition: "pattern-tracker",
        pendingFilename: `${Q$(l)}.md.pending`,
        pendingBody: renderNodeConvergeSignalBody(l)
    }));
    return {
        ranked: s,
        selected: u,
        topicsDirMissing: !1
    }
}
