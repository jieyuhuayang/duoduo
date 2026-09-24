// duoduo reconstruction — subsystem: 09-memory
// symbol: runActivationLint  (minified: rwe, daemon.pretty.js:68014)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runActivationLint(e, t, n) {
    let r = resolveMemoryDirs(t),
        i = scanActivationWindowTouches(e, t, n),
        o = i.dates,
        s = [...twe(t, r.entitiesDir, "entities"), ...twe(t, r.topicsDir, "topics")],
        a = new Map(s.map(x => [x.rel, x])),
        u = new Map;
    for (let [x, S] of i.touches) a.has(x) && u.set(x, S);
    let l = o.length > 0 ? o[0] : null,
        c = o.length > 0 ? o[o.length - 1] : null,
        d = l === null ? null : Date.parse(`${l}T00:00:00.000Z`),
        f = 0;
    if (d !== null)
        for (let x of s) u.has(x.rel) || x.birthtimeMs > 0 && x.birthtimeMs < d && (f += 1);
    let p = Rn(r.boardPath),
        m = p === null ? new Set : walkReachableMemory(p, createMemorySlugReader(r)),
        h = [];
    if (p !== null) {
        for (let [x, S] of u) {
            let D = Qa.basename(x, ".md");
            m.has(D) || h.push({
                rel: x,
                touches: S
            })
        }
        h.sort((x, S) => x.touches !== S.touches ? S.touches - x.touches : Tr(x.rel, S.rel))
    }
    let g = h.slice(0, nwe),
        y = N6(),
        v = [];
    if (p !== null) {
        let x = Bo(p);
        for (let S = 0; S < x.length; S += 1)
            for (let D of scanWikiLinkOccurrences(x[S])) {
                let $ = [];
                for (let C of ["entities", "topics"]) {
                    let A = `${C}/${D.slug}.md`;
                    a.has(A) && $.push({
                        rel: A,
                        touches: u.get(A) ?? 0
                    })
                }
                v.push({
                    line: S + 1,
                    slug: D.slug,
                    touches: $.length === 0 ? null : $.reduce((C, A) => C + A.touches, 0),
                    twins: $
                })
            }
    }
    let b = v.slice(0, y),
        _ = v.length - b.length,
        I = 0;
    for (let x of u.values()) I += x;
    let E = {
            windowDays: L6,
            windowStart: l,
            windowEnd: c,
            partitionFiles: o.length,
            interactionDays: i.interactionDays,
            foregroundToolEvents: i.foregroundToolEvents,
            memoryTouches: I,
            filesTouched: u.size,
            inventory: s.length,
            foregroundWrites: i.foregroundWrites,
            coldCount: f,
            hotOrphanCount: h.length,
            expansionRate: j6(I, i.foregroundToolEvents),
            liveRatio: j6(u.size, s.length),
            wiringIncompleteness: j6(h.length, u.size)
        },
        R = {
            windowDays: L6,
            windowStart: l,
            windowEnd: c,
            interactionDays: i.interactionDays,
            touches: u
        };
    return p === null ? {
        selected: [],
        metrics: E,
        touchWindow: R,
        hotOrphans: g,
        temperature: b,
        temperatureTruncated: _
    } : {
        selected: [{
            kind: Un.ACTIVATION_REPORT,
            partition: act,
            pendingFilename: "activation-report.md.pending",
            pendingBody: renderActivationReportBody(E, b, _, g)
        }],
        metrics: E,
        touchWindow: R,
        hotOrphans: g,
        temperature: b,
        temperatureTruncated: _
    }
}
