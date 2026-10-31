// duoduo reconstruction — subsystem: 09-memory
// symbol: runReadAuditedMemoryCheckStep  (minified: _a, daemon.pretty.js:70187)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): partition inboxes now have defined snapshot semantics, so a partition can no longer quietly lose or re-process work handed to it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runReadAuditedMemoryCheckStep(stepName, fn) {
    YSe();
    let ok = runMemoryCheckSubStep(stepName, fn),
        unreadableCount = ZSe();
    return unreadableCount > 0 && logErrorMessage(`[memory] check tick sub-step read ${unreadableCount} unreadable path(s): ${stepName} — results are degraded, inbox sweep suppressed this tick`), ok && unreadableCount === 0
}
