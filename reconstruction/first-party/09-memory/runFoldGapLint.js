// duoduo reconstruction — subsystem: 09-memory
// symbol: runFoldGapLint  (minified: qke, daemon.pretty.js:69655)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one consolidates them into intuition.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runFoldGapLint(memoryDir, referenceMs) {
    let newestFragmentMtimeMs = findNewestFragmentMtimeMs(memoryDir);
    return newestFragmentMtimeMs === null || newestFragmentMtimeMs <= referenceMs ? {
        selected: [],
        newestFragmentMs: newestFragmentMtimeMs,
        referenceMs
    } : {
        newestFragmentMs: newestFragmentMtimeMs,
        referenceMs,
        selected: [{
            kind: Jn.FOLD_GAP,
            partition: zke,
            pendingFilename: "fold-gap.md.pending",
            pendingBody: renderFoldGapBody()
        }]
    }
}
