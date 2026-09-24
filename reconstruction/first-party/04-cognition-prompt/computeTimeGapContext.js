// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: computeTimeGapContext  (minified: QSe, daemon.pretty.js:71631)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeTimeGapContext(e) {
    let t = (e.timeGapMinutes ?? Ydt) * 60 * 1e3;
    if (!(e.consumed || t <= 0) && !(!e.isChannelSession || !e.isUserMessage || !e.lastEventAt)) return {
        lastEventAt: e.lastEventAt,
        currentEventAt: e.currentEventAt ?? new Date().toISOString(),
        thresholdMs: t
    }
}
