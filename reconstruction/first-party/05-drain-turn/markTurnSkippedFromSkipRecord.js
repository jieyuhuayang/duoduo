// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: markTurnSkippedFromSkipRecord  (minified: Pxe, daemon.pretty.js:72099)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markTurnSkippedFromSkipRecord(e, t, n, r) {
    isClaudeRuntimeOrDefault(n) || r.skipped || await hasSkipRewindRecordSince(e, t, r.turnStartedAt) && (r.skipped = !0)
}
