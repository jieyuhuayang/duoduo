// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: Lct, daemon.pretty.js:68576)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    B6("ALADUO_EXP_MEMORY_FORGET") && !n && Le("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
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
        a = Fct(() => Mve(s));
    if (!a && !r) return o;
    let u = e.memoryDir,
        l = [],
        c = [],
        d = y => {
            l.push(...y);
            let v = rO(y, s);
            c.push(...v.posted), o.posted.push(...v.posted), o.withheld.push(...v.withheld);
            for (let b of v.errors) Le(`[memory] pending delivery failed: ${b}`)
        },
        f = null,
        p = aa("orphan-states", () => {
            let y = detectOrphanMemory(u, {
                refTimestampMs: t
            });
            y.missing || (f = y.states)
        }),
        m = f !== null && p,
        h = null;
    if (a) {
        let y = await swe(e);
        m = aa("board-lint", () => {
            d(gve(u, q6).selections)
        }) && m, m = aa("entity-lint", () => {
            d(wve(u, q6).selected)
        }) && m, m = aa("node-lint", () => {
            d(kve(u, q6).selected)
        }) && m, m = aa("gap-lint", () => {
            let I = Jve(e.eventsDir, u, t, s, {
                cadenceIntervalMs: resolveCadenceIntervalMs()
            });
            o.posted.push(...I.delivery.posted), o.withheld.push(...I.delivery.withheld);
            for (let E of I.delivery.errors) Le(`[memory] pending delivery failed: ${E}`)
        }) && m, m = aa("fold-lint", () => {
            d(awe(u, y).selected)
        }) && m, m = aa("broadcast-budget", () => {
            d(Xve(u).selected)
        }) && m, m = aa("broadcast-lint", () => {
            d(lwe(u).selected)
        }) && m, m = aa("broadcast-flatten", () => {
            d(dwe(u).selected)
        }) && m;
        let v, b = aa("activation-lint", () => {
            v = nwe(e.eventsDir, u, t)
        });
        m = b && m;
        let _;
        b && v && (d(v.selected), h = v.metrics, _ = v.touchWindow), m = aa("orphan-newborn-island", () => {
            if (f === null) return;
            d(gwe(f, _));
            let I = bwe(_we(f), t, void 0, void 0, _);
            I && d([I])
        }) && m, m && V6("inbox-sync", () => {
            let I = Dve(l, c, s);
            o.swept.push(...I.removed);
            for (let E of I.errors) Le(`[memory] inbox sync failed: ${E}`)
        })
    }
    let g = h;
    return g !== null && g.expansionRate !== null && await ps(e, "memory_activation_loss", g.expansionRate, {
        window_days: g.windowDays,
        interaction_days: g.interactionDays,
        window_start: g.windowStart,
        window_end: g.windowEnd,
        foreground_tool_events: g.foregroundToolEvents,
        memory_touches: g.memoryTouches,
        files_touched: g.filesTouched,
        inventory: g.inventory,
        foreground_writes: g.foregroundWrites,
        expansion_rate: g.expansionRate,
        live_ratio: g.liveRatio,
        dead_weight: g.coldCount,
        wiring_incompleteness: g.wiringIncompleteness
    }), r && V6("orphan-forget", () => {
        if (f === null) return;
        let y = [];
        for (let v of f) {
            if (v.state !== "STALE") {
                y.push(v);
                continue
            }
            jve(s, routeContractDecision(v)) ? y.push(v) : o.sparedUnwarnable.push(v.rel)
        }
        o.forgotten.push(...forgetMemoryEntry(y, e.kernelDir, {
            dryRun: !1
        }))
    }), (o.posted.length > 0 || o.swept.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && Q("[memory] check tick", {
        posted: o.posted.map(y => wwe.basename(y)),
        swept: o.swept.map(y => wwe.basename(y)),
        withheld: o.withheld,
        forgotten: o.forgotten,
        spared_unwarnable: o.sparedUnwarnable
    }), o
}
