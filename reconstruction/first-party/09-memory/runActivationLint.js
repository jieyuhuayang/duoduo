// duoduo reconstruction — subsystem: 09-memory
// symbol: runActivationLint  (minified: bSe, daemon.pretty.js:68305)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runActivationLint(e, t, n) {
    let r = resolveMemoryDirs(t),
        i = scanActivationWindowTouches(e, t, n),
        o = i.dates,
        s = [...ySe(t, r.entitiesDir, "entities"), ...ySe(t, r.topicsDir, "topics")],
        a = new Map(s.map(k => [k.rel, k])),
        u = new Map;
    for (let [k, S] of i.touches) a.has(k) && u.set(k, S);
    let l = o.length > 0 ? o[0] : null,
        c = o.length > 0 ? o[o.length - 1] : null,
        d = l === null ? null : Date.parse(`${l}T00:00:00.000Z`),
        f = 0;
    if (d !== null)
        for (let k of s) u.has(k.rel) || k.birthtimeMs > 0 && k.birthtimeMs < d && (f += 1);
    let p = Tn(r.boardPath),
        m = p === null ? new Set : walkReachableMemory(p, createMemorySlugReader(r)),
        h = [];
    if (p !== null) {
        for (let [k, S] of u) {
            let D = uu.basename(k, ".md");
            m.has(D) || h.push({
                rel: k,
                touches: S
            })
        }
        h.sort((k, S) => k.touches !== S.touches ? S.touches - k.touches : Ar(k.rel, S.rel))
    }
    let g = h.slice(0, _Se),
        y = NH(),
        v = [];
    if (p !== null) {
        let k = Jo(p);
        for (let S = 0; S < k.length; S += 1)
            for (let D of scanWikiLinkOccurrences(k[S])) {
                let A = [];
                for (let $ of ["entities", "topics"]) {
                    let C = `${$}/${D.slug}.md`;
                    a.has(C) && A.push({
                        rel: C,
                        touches: u.get(C) ?? 0
                    })
                }
                v.push({
                    line: S + 1,
                    slug: D.slug,
                    touches: A.length === 0 ? null : A.reduce(($, C) => $ + C.touches, 0),
                    twins: A
                })
            }
    }
    let b = v.slice(0, y),
        _ = v.length - b.length,
        E = 0;
    for (let k of u.values()) E += k;
    let R = {
            windowDays: LH,
            windowStart: l,
            windowEnd: c,
            partitionFiles: o.length,
            interactionDays: i.interactionDays,
            foregroundToolEvents: i.foregroundToolEvents,
            memoryTouches: E,
            filesTouched: u.size,
            inventory: s.length,
            foregroundWrites: i.foregroundWrites,
            coldCount: f,
            hotOrphanCount: h.length,
            expansionRate: jH(E, i.foregroundToolEvents),
            liveRatio: jH(u.size, s.length),
            wiringIncompleteness: jH(h.length, u.size)
        },
        P = {
            windowDays: LH,
            windowStart: l,
            windowEnd: c,
            interactionDays: i.interactionDays,
            touches: u
        };
    return p === null ? {
        selected: [],
        metrics: R,
        touchWindow: P,
        hotOrphans: g,
        temperature: b,
        temperatureTruncated: _
    } : {
        selected: [{
            kind: Vn.ACTIVATION_REPORT,
            partition: nft,
            pendingFilename: "activation-report.md.pending",
            pendingBody: renderActivationReportBody(R, b, _, g)
        }],
        metrics: R,
        touchWindow: P,
        hotOrphans: g,
        temperature: b,
        temperatureTruncated: _
    }
}
