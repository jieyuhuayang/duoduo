// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: qct, daemon.pretty.js:68573)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    V6("ALADUO_EXP_MEMORY_FORGET") && !n && Le("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
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
        a = Bct(() => jve(s));
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
        p = ua("orphan-states", () => {
            let y = detectOrphanMemory(u, {
                refTimestampMs: t
            });
            y.missing || (f = y.states)
        }),
        m = f !== null && p,
        h = null;
    if (a) {
        let y = await awe(e);
        m = ua("board-lint", () => {
            d(yve(u, B6).selections)
        }) && m, m = ua("entity-lint", () => {
            d(Sve(u, B6).selected)
        }) && m, m = ua("node-lint", () => {
            d(xve(u, B6).selected)
        }) && m, m = ua("gap-lint", () => {
            let I = Zve(e.eventsDir, u, t, s, {
                cadenceIntervalMs: resolveCadenceIntervalMs()
            });
            o.posted.push(...I.delivery.posted), o.withheld.push(...I.delivery.withheld);
            for (let E of I.delivery.errors) Le(`[memory] pending delivery failed: ${E}`)
        }) && m, m = ua("fold-lint", () => {
            d(uwe(u, y).selected)
        }) && m, m = ua("broadcast-budget", () => {
            d(Qve(u).selected)
        }) && m, m = ua("broadcast-lint", () => {
            d(cwe(u).selected)
        }) && m, m = ua("broadcast-flatten", () => {
            d(fwe(u).selected)
        }) && m;
        let v, b = ua("activation-lint", () => {
            v = rwe(e.eventsDir, u, t)
        });
        m = b && m;
        let _;
        b && v && (d(v.selected), h = v.metrics, _ = v.touchWindow), m = ua("orphan-newborn-island", () => {
            if (f === null) return;
            d(ywe(f, _));
            let I = vwe(bwe(f), t, void 0, void 0, _);
            I && d([I])
        }) && m, m && H6("inbox-sync", () => {
            let I = Mve(l, c, s);
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
    }), r && H6("orphan-forget", () => {
        if (f === null) return;
        let y = [];
        for (let v of f) {
            if (v.state !== "STALE") {
                y.push(v);
                continue
            }
            Lve(s, routeContractDecision(v)) ? y.push(v) : o.sparedUnwarnable.push(v.rel)
        }
        o.forgotten.push(...forgetMemoryEntry(y, e.kernelDir, {
            dryRun: !1
        }))
    }), (o.posted.length > 0 || o.swept.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && te("[memory] check tick", {
        posted: o.posted.map(y => Swe.basename(y)),
        swept: o.swept.map(y => Swe.basename(y)),
        withheld: o.withheld,
        forgotten: o.forgotten,
        spared_unwarnable: o.sparedUnwarnable
    }), o
}
