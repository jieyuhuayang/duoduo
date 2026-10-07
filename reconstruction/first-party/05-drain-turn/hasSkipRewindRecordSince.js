// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasSkipRewindRecordSince  (minified: Hmt, daemon.pretty.js:72093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.6 (medium): The skip-rewind injection only fires on genuine human turns, not on periodic cadence pings.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function hasSkipRewindRecordSince(e, t, n) {
    let i = (await readSessionRuntimeState(e, t).catch(() => null))?.pending_skip_rewind?.skipped_at;
    if (!i) return !1;
    let o = Date.parse(i);
    return Number.isFinite(o) && o >= n
}
