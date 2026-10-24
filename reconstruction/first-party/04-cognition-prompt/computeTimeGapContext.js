// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: computeTimeGapContext  (minified: LEe, daemon.pretty.js:74016)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeTimeGapContext(params) {
    let thresholdMs = (params.timeGapMinutes ?? O_t) * 60 * 1e3;
    if (!(params.consumed || thresholdMs <= 0) && !(!params.isChannelSession || !params.isUserMessage || !params.lastEventAt)) return {
        lastEventAt: params.lastEventAt,
        currentEventAt: params.currentEventAt ?? new Date().toISOString(),
        thresholdMs
    }
}
