// duoduo reconstruction — subsystem: 09-memory
// symbol: deliverScanGapSignal  (minified: cSe, daemon.pretty.js:68003)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function deliverScanGapSignal(e, t, n, r, i) {
    let o = zc.join(partitionInboxDirFromVar(r.varDir, "gradient-distiller"), aSe);
    if (au.existsSync(o)) return {
        selected: [],
        span: null,
        bands: [],
        readFault: !1,
        pending: !0,
        recorded: !1,
        delivery: qO()
    };
    let s = i.dryRun === !0,
        a = readOrSeedGapHandedDays(t, r.varDir, s);
    if (a.readFault) return {
        ...buildGapReadFaultResult(null),
        pending: !1,
        recorded: !1,
        delivery: qO()
    };
    let u = runGapLint(e, a.coverage, n, i.cadenceIntervalMs);
    if (u.readFault || s) return {
        ...u,
        pending: !1,
        recorded: !1,
        delivery: qO()
    };
    if (u.selected.length === 0) {
        let d = u.span !== null;
        return d && appendGapHandedSpan(r.varDir, u.span), {
            ...u,
            pending: !1,
            recorded: d,
            delivery: qO()
        }
    }
    let l = postMemorySignalsToInboxes(u.selected, r),
        c = l.posted.length > 0;
    return c && appendGapHandedSpan(r.varDir, u.span), {
        ...u,
        pending: !1,
        recorded: c,
        delivery: l
    }
}
