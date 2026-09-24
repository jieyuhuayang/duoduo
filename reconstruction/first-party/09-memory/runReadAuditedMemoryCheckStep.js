// duoduo reconstruction — subsystem: 09-memory
// symbol: runReadAuditedMemoryCheckStep  (minified: ua, daemon.pretty.js:68697)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runReadAuditedMemoryCheckStep(e, t) {
    mve();
    let n = runMemoryCheckSubStep(e, t),
        r = pve();
    return r > 0 && Le(`[memory] check tick sub-step read ${r} unreadable path(s): ${e} — results are degraded, inbox sweep suppressed this tick`), n && r === 0
}
