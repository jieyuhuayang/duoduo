// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: markTurnSkippedFromSkipRecord  (minified: Oxe, daemon.pretty.js:72100)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markTurnSkippedFromSkipRecord(paths, sessionKey, runtime, turnResult) {
    isClaudeRuntimeOrDefault(runtime) || turnResult.skipped || await hasSkipRewindRecordSince(paths, sessionKey, turnResult.turnStartedAt) && (turnResult.skipped = !0)
}
