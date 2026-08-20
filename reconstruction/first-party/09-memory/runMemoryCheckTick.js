// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: _Xe, daemon.pretty.js:58383)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    m2("ALADUO_EXP_MEMORY_FORGET") && !n && et("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
    let o = {
            checkEnabled: n,
            forgetEnabled: r,
            posted: [],
            swept: [],
            withheld: [],
            forgotten: [],
            sparedUnwarnable: []
        },
        s = {
            subconsciousDir: e.subconsciousDir,
            varDir: e.varDir,
            flagFallback: n
        },
        a = bXe(() => $pe(s));
    if (!a && !r) return o;
    let l = e.memoryDir,
        u = [],
        c = [],
        d = h => {
            u.push(...h);
            let y = Ppe(h, s);
            c.push(...y.posted), o.posted.push(...y.posted), o.withheld.push(...y.withheld);
            for (let _ of y.errors) et(`[memory] pending delivery failed: ${_}`)
        },
        p = null,
        f = eh("orphan-states", () => {
            let h = detectOrphanMemory(l, {
                refTimestampMs: t
            });
            h.missing || (p = h.states)
        }),
        m = p !== null && f;
    return a && (m = eh("board-lint", () => {
        d(ipe(l, p2).selections)
    }) && m, m = eh("entity-lint", () => {
        d(upe(l, p2).selected)
    }) && m, m = eh("node-lint", () => {
        d(dpe(l, p2).selected)
    }) && m, m = eh("gap-lint", () => {
        d(runGapLint(e.eventsDir, l).selected)
    }) && m, m = eh("orphan-newborn-island", () => {
        if (p === null) return;
        d(vpe(p));
        let h = kpe(Spe(p), t);
        h && d([h])
    }) && m, m && h2("inbox-sync", () => {
        let h = Ope(u, c, s);
        o.swept.push(...h.removed);
        for (let y of h.errors) et(`[memory] inbox sync failed: ${y}`)
    })), r && h2("orphan-forget", () => {
        if (p === null) return;
        let h = [];
        for (let y of p) {
            if (y.state !== "STALE") {
                h.push(y);
                continue
            }
            Ape(s, routeContractDecision(y)) ? h.push(y) : o.sparedUnwarnable.push(y.rel)
        }
        o.forgotten.push(...forgetMemoryEntry(h, e.kernelDir, {
            dryRun: !1
        }))
    }), (o.posted.length > 0 || o.swept.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && K("[memory] check tick", {
        posted: o.posted.map(h => Dpe.basename(h)),
        swept: o.swept.map(h => Dpe.basename(h)),
        withheld: o.withheld,
        forgotten: o.forgotten,
        spared_unwarnable: o.sparedUnwarnable
    }), o
}
