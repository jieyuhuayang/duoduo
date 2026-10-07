// duoduo reconstruction — subsystem: 09-memory
// symbol: runEntityLint  (minified: Uwe, daemon.pretty.js:67204)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runEntityLint(e, t, n) {
    let r = resolveMemoryDirs(e);
    if (!isMemoryPathDirectory(r.entitiesDir)) return {
        ranked: [],
        selected: [],
        entitiesDirMissing: !0
    };
    let i = readMemoryFileSyncOrNull(r.boardPath) ?? "",
        o = walkReachableMemory(i, createMemorySlugReader(r)),
        s = [];
    for (let l of listMarkdownSlugsSync(r.entitiesDir)) {
        let c = readMemoryFileSyncOrNull(fdt.join(r.entitiesDir, `${l}.md`));
        if (c === null || pdt(c)) continue;
        let d = bytesToKibCeil(measureUtf8ByteLength(c)),
            f = countNewlineChars(c),
            p = countDatedStampLines(c),
            m = d * 1e3 + p;
        s.push({
            slug: l,
            kb: d,
            lines: f,
            dated: p,
            reachable: o.has(l),
            score: m
        })
    }
    s.sort(Lwe);
    let u = (Number.isFinite(t) && t > 0 ? s.slice(0, t) : []).map(l => ({
        row: l,
        kind: Vn.ENTITY_CONVERGE,
        partition: "intuition-weaver",
        pendingFilename: `entity-converge-${l.slug}.md.pending`,
        pendingBody: renderEntityConvergeSignalBody(l)
    }));
    return {
        ranked: s,
        selected: u,
        entitiesDirMissing: !1
    }
}
