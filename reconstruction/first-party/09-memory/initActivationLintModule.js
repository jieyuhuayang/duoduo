// duoduo reconstruction — subsystem: 09-memory
// symbol: initActivationLintModule  (minified: gW, daemon.pretty.js:69603)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var pW, Mke, Smt, kmt, xmt, initActivationLintModule = A(() => {
    "use strict";
    oo();
    OS();
    initBroadcastBudgetLintModule();
    initMemorySignalKindsModule();
    pW = 30, Mke = 10, Smt = "intuition-weaver", kmt = /^(\d{4}-\d{2}-\d{2})\.jsonl$/, xmt = new Set(["Write", "Edit", "NotebookEdit", "write", "edit", "search_replace", "apply_patch", "strreplace"])
});
