// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: HKe, daemon.pretty.js:57094)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    SU("ALADUO_EXP_MEMORY_FORGET") && !n && Be("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
    let s = {
            checkEnabled: n,
            forgetEnabled: r,
            posted: [],
            withheld: [],
            forgotten: [],
            sparedUnwarnable: []
        },
        o = {
            subconsciousDir: e.subconsciousDir,
            varDir: e.varDir,
            flagFallback: n
        },
        a = VKe(() => xle(o));
    if (!a && !r) return s;
    let c = e.memoryDir,
        u = d => {
            let p = kle(d, o);
            s.posted.push(...p.posted), s.withheld.push(...p.withheld);
            for (let f of p.errors) Be(`[memory] pending delivery failed: ${f}`)
        },
        l = null;
    return nd("orphan-states", () => {
        let d = detectOrphanMemory(c, {
            refTimestampMs: t
        });
        d.missing || (l = d.states)
    }), a && (nd("board-lint", () => {
        u(Que(c, wU).selections)
    }), nd("entity-lint", () => {
        u(rle(c, wU).selected)
    }), nd("node-lint", () => {
        u(sle(c, wU).selected)
    }), nd("gap-lint", () => {
        u(runGapLint(e.eventsDir, c).selected)
    }), nd("orphan-newborn-island", () => {
        if (l === null) return;
        u(mle(l));
        let d = yle(gle(l), t);
        d && u([d])
    })), r && nd("orphan-forget", () => {
        if (l === null) return;
        let d = [];
        for (let p of l) {
            if (p.state !== "STALE") {
                d.push(p);
                continue
            }
            Ele(o, routeContractDecision(p)) ? d.push(p) : s.sparedUnwarnable.push(p.rel)
        }
        s.forgotten.push(...forgetMemoryEntry(d, e.kernelDir, {
            dryRun: !1
        }))
    }), (s.posted.length > 0 || s.forgotten.length > 0 || s.withheld.length > 0 || s.sparedUnwarnable.length > 0) && K("[memory] check tick", {
        posted: s.posted.map(d => BKe.basename(d)),
        withheld: s.withheld,
        forgotten: s.forgotten,
        spared_unwarnable: s.sparedUnwarnable
    }), s
}
