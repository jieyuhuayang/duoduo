// duoduo reconstruction — subsystem: 09-memory
// symbol: deliverScanGapSignal  (minified: oxe, daemon.pretty.js:70086)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 12 renamed — 0 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function deliverScanGapSignal(eventsDir, memoryDir, nowMs, ctx, options) {
    let pendingPath = qc.join(partitionInboxDirFromVar(ctx.varDir, "gradient-distiller"), nxe);
    if (lu.existsSync(pendingPath)) return {
        selected: [],
        span: null,
        bands: [],
        readFault: !1,
        pending: !0,
        recorded: !1,
        delivery: iA()
    };
    let dryRun = options.dryRun === !0,
        handed = readOrSeedGapHandedDays(memoryDir, ctx.varDir, dryRun);
    if (handed.readFault) return {
        ...buildGapReadFaultResult(null),
        pending: !1,
        recorded: !1,
        delivery: iA()
    };
    let lint = runGapLint(eventsDir, handed.coverage, nowMs, options.cadenceIntervalMs);
    if (lint.readFault || dryRun) return {
        ...lint,
        pending: !1,
        recorded: !1,
        delivery: iA()
    };
    if (lint.selected.length === 0) {
        let recorded = lint.span !== null;
        return recorded && appendGapHandedSpan(ctx.varDir, lint.span), {
            ...lint,
            pending: !1,
            recorded,
            delivery: iA()
        }
    }
    let delivery = postMemorySignalsToInboxes(lint.selected, ctx),
        posted = delivery.posted.length > 0;
    return posted && appendGapHandedSpan(ctx.varDir, lint.span), {
        ...lint,
        pending: !1,
        recorded: posted,
        delivery
    }
}
