// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: $Ke, daemon.pretty.js:56972)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
    let {
        check: n,
        forget: r
    } = resolveMemoryCheckFlags();
    _U("ALADUO_EXP_MEMORY_FORGET") && !n && Ve("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
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
        a = OKe(() => mle(o));
    if (!a && !r) return s;
    let u = e.memoryDir,
        c = d => {
            let p = ple(d, o);
            s.posted.push(...p.posted), s.withheld.push(...p.withheld);
            for (let f of p.errors) Ve(`[memory] pending delivery failed: ${f}`)
        },
        l = null;
    return nd("orphan-states", () => {
        let d = detectOrphanMemory(u, {
            refTimestampMs: t
        });
        d.missing || (l = d.states)
    }), a && (nd("board-lint", () => {
        c(qce(u, yU).selections)
    }), nd("entity-lint", () => {
        c(Wce(u, yU).selected)
    }), nd("node-lint", () => {
        c(Gce(u, yU).selected)
    }), nd("gap-lint", () => {
        c(runGapLint(e.eventsDir, u).selected)
    }), nd("orphan-newborn-island", () => {
        if (l === null) return;
        c(ile(l));
        let d = ale(ole(l), t);
        d && c([d])
    })), r && nd("orphan-forget", () => {
        if (l === null) return;
        let d = [];
        for (let p of l) {
            if (p.state !== "STALE") {
                d.push(p);
                continue
            }
            hle(o, routeContractDecision(p)) ? d.push(p) : s.sparedUnwarnable.push(p.rel)
        }
        s.forgotten.push(...forgetMemoryEntry(d, e.kernelDir, {
            dryRun: !1
        }))
    }), (s.posted.length > 0 || s.forgotten.length > 0 || s.withheld.length > 0 || s.sparedUnwarnable.length > 0) && J("[memory] check tick", {
        posted: s.posted.map(d => PKe.basename(d)),
        withheld: s.withheld,
        forgotten: s.forgotten,
        spared_unwarnable: s.sparedUnwarnable
    }), s
}
