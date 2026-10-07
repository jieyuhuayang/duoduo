// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: computeTimeGapContext  (minified: Bxe, daemon.pretty.js:71933)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeTimeGapContext(e) {
    let t = (e.timeGapMinutes ?? Nmt) * 60 * 1e3;
    if (!(e.consumed || t <= 0) && !(!e.isChannelSession || !e.isUserMessage || !e.lastEventAt)) return {
        lastEventAt: e.lastEventAt,
        currentEventAt: e.currentEventAt ?? new Date().toISOString(),
        thresholdMs: t
    }
}
