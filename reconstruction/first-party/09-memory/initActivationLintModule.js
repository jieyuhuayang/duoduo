// duoduo reconstruction — subsystem: 09-memory
// symbol: initActivationLintModule  (minified: SW, daemon.pretty.js:70487)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var bW, pxe, egt, tgt, ngt, initActivationLintModule = N(() => {
    "use strict";
    to();
    TS();
    initBroadcastBudgetLintModule();
    initMemorySignalKindsModule();
    bW = 30, pxe = 10, egt = "intuition-weaver", tgt = /^(\d{4}-\d{2}-\d{2})\.jsonl$/, ngt = new Set(["Write", "Edit", "NotebookEdit", "write", "edit", "search_replace", "apply_patch", "strreplace"])
});
