// duoduo reconstruction — subsystem: 09-memory
// symbol: deliverScanGapSignal  (minified: Zve, daemon.pretty.js:67712)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function deliverScanGapSignal(e, t, n, r, i) {
    let o = Cc.join(partitionInboxDirFromVar(r.varDir, "gradient-distiller"), Hve);
    if (Xa.existsSync(o)) return {
        selected: [],
        span: null,
        bands: [],
        readFault: !1,
        pending: !0,
        recorded: !1,
        delivery: oO()
    };
    let s = i.dryRun === !0,
        a = Hlt(t, r.varDir, s);
    if (a.readFault) return {
        ...sO(null),
        pending: !1,
        recorded: !1,
        delivery: oO()
    };
    let u = runGapLint(e, a.coverage, n, i.cadenceIntervalMs);
    if (u.readFault || s) return {
        ...u,
        pending: !1,
        recorded: !1,
        delivery: oO()
    };
    if (u.selected.length === 0) {
        let d = u.span !== null;
        return d && zve(r.varDir, u.span), {
            ...u,
            pending: !1,
            recorded: d,
            delivery: oO()
        }
    }
    let l = postMemorySignalsToInboxes(u.selected, r),
        c = l.posted.length > 0;
    return c && zve(r.varDir, u.span), {
        ...u,
        pending: !1,
        recorded: c,
        delivery: l
    }
}
