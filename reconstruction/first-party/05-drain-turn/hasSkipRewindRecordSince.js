// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasSkipRewindRecordSince  (minified: Hmt, daemon.pretty.js:72093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function hasSkipRewindRecordSince(e, t, n) {
    let i = (await rt(e, t).catch(() => null))?.pending_skip_rewind?.skipped_at;
    if (!i) return !1;
    let o = Date.parse(i);
    return Number.isFinite(o) && o >= n
}
