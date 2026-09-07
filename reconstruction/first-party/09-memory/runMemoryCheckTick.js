// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: Fnt, daemon.pretty.js:62129)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    O4("ALADUO_EXP_MEMORY_FORGET") && !n && Me("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
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
        a = znt(() => Fhe(s));
    if (!a && !r) return o;
    let l = e.memoryDir,
        u = [],
        c = [],
        d = y => {
            u.push(...y);
            let w = IP(y, s);
            c.push(...w.posted), o.posted.push(...w.posted), o.withheld.push(...w.withheld);
            for (let v of w.errors) Me(`[memory] pending delivery failed: ${v}`)
        },
        p = null,
        f = Ms("orphan-states", () => {
            let y = detectOrphanMemory(l, {
                refTimestampMs: t
            });
            y.missing || (p = y.states)
        }),
        m = p !== null && f,
        h = null;
    if (a) {
        let y = await uge(e);
        m = Ms("board-lint", () => {
            d(bhe(l, C4).selections)
        }) && m, m = Ms("entity-lint", () => {
            d(xhe(l, C4).selected)
        }) && m, m = Ms("node-lint", () => {
            d(Rhe(l, C4).selected)
        }) && m, m = Ms("gap-lint", () => {
            let R = Khe(e.eventsDir, l, t, s, {
                cadenceIntervalMs: resolveCadenceIntervalMs()
            });
            o.posted.push(...R.delivery.posted), o.withheld.push(...R.delivery.withheld);
            for (let I of R.delivery.errors) Me(`[memory] pending delivery failed: ${I}`)
        }) && m, m = Ms("fold-lint", () => {
            d(cge(l, y).selected)
        }) && m, m = Ms("broadcast-budget", () => {
            d(tge(l).selected)
        }) && m, m = Ms("broadcast-lint", () => {
            d(fge(l).selected)
        }) && m, m = Ms("broadcast-flatten", () => {
            d(mge(l).selected)
        }) && m;
        let w, v = Ms("activation-lint", () => {
            w = oge(e.eventsDir, l, t)
        });
        m = v && m;
        let b;
        v && w && (d(w.selected), h = w.metrics, b = w.touchWindow), m = Ms("orphan-newborn-island", () => {
            if (p === null) return;
            d(bge(p, b));
            let R = Sge(wge(p), t, void 0, void 0, b);
            R && d([R])
        }) && m, m && $4("inbox-sync", () => {
            let R = Lhe(u, c, s);
            o.swept.push(...R.removed);
            for (let I of R.errors) Me(`[memory] inbox sync failed: ${I}`)
        })
    }
    let g = h;
    return g !== null && g.expansionRate !== null && await Ho(e, "memory_activation_loss", g.expansionRate, {
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
    }), r && $4("orphan-forget", () => {
        if (p === null) return;
        let y = [];
        for (let w of p) {
            if (w.state !== "STALE") {
                y.push(w);
                continue
            }
            zhe(s, routeContractDecision(w)) ? y.push(w) : o.sparedUnwarnable.push(w.rel)
        }
        o.forgotten.push(...forgetMemoryEntry(y, e.kernelDir, {
            dryRun: !1
        }))
    }), (o.posted.length > 0 || o.swept.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && Q("[memory] check tick", {
        posted: o.posted.map(y => xge.basename(y)),
        swept: o.swept.map(y => xge.basename(y)),
        withheld: o.withheld,
        forgotten: o.forgotten,
        spared_unwarnable: o.sparedUnwarnable
    }), o
}
