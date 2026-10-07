// duoduo reconstruction — subsystem: 09-memory
// symbol: runFoldGapLint  (minified: xSe, daemon.pretty.js:68456)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one consolidates them into intuition.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runFoldGapLint(e, t) {
    let n = findNewestFragmentMtimeMs(e);
    return n === null || n <= t ? {
        selected: [],
        newestFragmentMs: n,
        referenceMs: t
    } : {
        newestFragmentMs: n,
        referenceMs: t,
        selected: [{
            kind: Vn.FOLD_GAP,
            partition: SSe,
            pendingFilename: "fold-gap.md.pending",
            pendingBody: renderFoldGapBody()
        }]
    }
}
