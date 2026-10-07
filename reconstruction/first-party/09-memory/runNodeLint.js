// duoduo reconstruction — subsystem: 09-memory
// symbol: runNodeLint  (minified: Bwe, daemon.pretty.js:67281)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.5.6 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runNodeLint(e, t = 1, n) {
    let r = resolveMemoryDirs(e);
    if (!isMemoryPathDirectory(r.topicsDir)) return {
        ranked: [],
        selected: [],
        topicsDirMissing: !0
    };
    let i = readMemoryFileSyncOrNull(r.boardPath) ?? "",
        o = walkReachableMemory(i, createMemorySlugReader(r)),
        s = [];
    for (let l of listMarkdownSlugsSync(r.topicsDir)) {
        let c = bdt(l);
        if (c === null) continue;
        let d = l.slice(`${c}-`.length),
            f = readMemoryFileSyncOrNull(hdt.join(r.topicsDir, `${l}.md`));
        if (f === null) continue;
        let p = ydt(f, c),
            m = countNewlineChars(f);
        if (p.length === 0 && m <= xH) continue;
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
    s.sort(vdt);
    let u = (Number.isFinite(t) && t > 0 ? s.slice(0, t) : []).map(l => ({
        row: l,
        kind: Vn.NODE_CONVERGE,
        partition: "pattern-tracker",
        pendingFilename: `${buildNodeSignalKey(l)}.md.pending`,
        pendingBody: renderNodeConvergeSignalBody(l)
    }));
    return {
        ranked: s,
        selected: u,
        topicsDirMissing: !1
    }
}
