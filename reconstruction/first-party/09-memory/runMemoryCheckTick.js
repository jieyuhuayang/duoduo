// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: _it, daemon.pretty.js:62716)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    uB("ALADUO_EXP_MEMORY_FORGET") && !n && Me("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
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
        a = bit(() => Age(s));
    if (!a && !r) return o;
    let l = e.memoryDir,
        u = [],
        c = [],
        d = y => {
            u.push(...y);
            let w = JP(y, s);
            c.push(...w.posted), o.posted.push(...w.posted), o.withheld.push(...w.withheld);
            for (let v of w.errors) Me(`[memory] pending delivery failed: ${v}`)
        },
        p = null,
        f = Hs("orphan-states", () => {
            let y = detectOrphanMemory(l, {
                refTimestampMs: t
            });
            y.missing || (p = y.states)
        }),
        m = p !== null && f,
        h = null;
    if (a) {
        let y = await rye(e);
        m = Hs("board-lint", () => {
            d(pge(l, lB).selections)
        }) && m, m = Hs("entity-lint", () => {
            d(_ge(l, lB).selected)
        }) && m, m = Hs("node-lint", () => {
            d(vge(l, lB).selected)
        }) && m, m = Hs("gap-lint", () => {
            let I = Hge(e.eventsDir, l, t, s, {
                cadenceIntervalMs: resolveCadenceIntervalMs()
            });
            o.posted.push(...I.delivery.posted), o.withheld.push(...I.delivery.withheld);
            for (let T of I.delivery.errors) Me(`[memory] pending delivery failed: ${T}`)
        }) && m, m = Hs("fold-lint", () => {
            d(iye(l, y).selected)
        }) && m, m = Hs("broadcast-budget", () => {
            d(Zge(l).selected)
        }) && m, m = Hs("broadcast-lint", () => {
            d(sye(l).selected)
        }) && m, m = Hs("broadcast-flatten", () => {
            d(lye(l).selected)
        }) && m;
        let w, v = Hs("activation-lint", () => {
            w = Qge(e.eventsDir, l, t)
        });
        m = v && m;
        let b;
        v && w && (d(w.selected), h = w.metrics, b = w.touchWindow), m = Hs("orphan-newborn-island", () => {
            if (p === null) return;
            d(pye(p, b));
            let I = gye(hye(p), t, void 0, void 0, b);
            I && d([I])
        }) && m, m && cB("inbox-sync", () => {
            let I = $ge(u, c, s);
            o.swept.push(...I.removed);
            for (let T of I.errors) Me(`[memory] inbox sync failed: ${T}`)
        })
    }
    let g = h;
    return g !== null && g.expansionRate !== null && await Xo(e, "memory_activation_loss", g.expansionRate, {
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
    }), r && cB("orphan-forget", () => {
        if (p === null) return;
        let y = [];
        for (let w of p) {
            if (w.state !== "STALE") {
                y.push(w);
                continue
            }
            Nge(s, routeContractDecision(w)) ? y.push(w) : o.sparedUnwarnable.push(w.rel)
        }
        o.forgotten.push(...forgetMemoryEntry(y, e.kernelDir, {
            dryRun: !1
        }))
    }), (o.posted.length > 0 || o.swept.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && ee("[memory] check tick", {
        posted: o.posted.map(y => _ye.basename(y)),
        swept: o.swept.map(y => _ye.basename(y)),
        withheld: o.withheld,
        forgotten: o.forgotten,
        spared_unwarnable: o.sparedUnwarnable
    }), o
}
