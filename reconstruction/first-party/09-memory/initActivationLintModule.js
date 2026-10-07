// duoduo reconstruction — subsystem: 09-memory
// symbol: initActivationLintModule  (minified: UH, daemon.pretty.js:68404)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var LH, _Se, nft, rft, ift, initActivationLintModule = O(() => {
    "use strict";
    Qi();
    gS();
    initBroadcastBudgetLintModule();
    initMemorySignalKindsModule();
    LH = 30, _Se = 10, nft = "intuition-weaver", rft = /^(\d{4}-\d{2}-\d{2})\.jsonl$/, ift = new Set(["Write", "Edit", "NotebookEdit", "write", "edit", "search_replace", "apply_patch", "strreplace"])
});
