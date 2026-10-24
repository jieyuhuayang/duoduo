// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasSkipRewindRecordSince  (minified: B_t, daemon.pretty.js:74176)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): The skip-rewind injection only fires on genuine human turns, not on periodic cadence pings.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function hasSkipRewindRecordSince(paths, sessionKey, sinceMs) {
    let skippedAt = (await readSessionRuntimeState(paths, sessionKey).catch(() => null))?.pending_skip_rewind?.skipped_at;
    if (!skippedAt) return !1;
    let skippedAtMs = Date.parse(skippedAt);
    return Number.isFinite(skippedAtMs) && skippedAtMs >= sinceMs
}
