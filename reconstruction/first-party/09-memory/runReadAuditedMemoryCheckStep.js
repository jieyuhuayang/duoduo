// duoduo reconstruction — subsystem: 09-memory
// symbol: runReadAuditedMemoryCheckStep  (minified: fa, daemon.pretty.js:68988)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.1 (medium): partition inboxes now have defined snapshot semantics, so a partition can no longer quietly lose or re-process work handed to it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runReadAuditedMemoryCheckStep(e, t) {
    Awe();
    let n = runMemoryCheckSubStep(e, t),
        r = Owe();
    return r > 0 && logErrorMessage(`[memory] check tick sub-step read ${r} unreadable path(s): ${e} — results are degraded, inbox sweep suppressed this tick`), n && r === 0
}
