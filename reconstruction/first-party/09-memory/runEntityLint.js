// duoduo reconstruction — subsystem: 09-memory
// symbol: runEntityLint  (minified: Sve, daemon.pretty.js:66932)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runEntityLint(e, t, n) {
    let r = resolveMemoryDirs(e);
    if (!vg(r.entitiesDir)) return {
        ranked: [],
        selected: [],
        entitiesDirMissing: !0
    };
    let i = Rn(r.boardPath) ?? "",
        o = walkReachableMemory(i, createMemorySlugReader(r)),
        s = [];
    for (let l of Ka(r.entitiesDir)) {
        let c = Rn(_lt.join(r.entitiesDir, `${l}.md`));
        if (c === null || blt(c)) continue;
        let d = K$(X$(c)),
            f = Y$(c),
            p = dve(c),
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
    s.sort(bve);
    let u = (Number.isFinite(t) && t > 0 ? s.slice(0, t) : []).map(l => ({
        row: l,
        kind: Un.ENTITY_CONVERGE,
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
