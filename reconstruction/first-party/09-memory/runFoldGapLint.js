// duoduo reconstruction — subsystem: 09-memory
// symbol: runFoldGapLint  (minified: xSe, daemon.pretty.js:68456)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
