// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: markTurnSkippedFromSkipRecord  (minified: FSe, daemon.pretty.js:71797)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markTurnSkippedFromSkipRecord(e, t, n, r) {
    Yw(n) || r.skipped || await uft(e, t, r.turnStartedAt) && (r.skipped = !0)
}
