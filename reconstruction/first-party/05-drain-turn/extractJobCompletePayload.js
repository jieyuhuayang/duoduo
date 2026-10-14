// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractJobCompletePayload  (minified: Yxe, daemon.pretty.js:72191)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobCompletePayload(event) {
    if (event.type !== "route.deliver") return null;
    let routePayload = isNonNullObject(event.payload) ? event.payload : void 0;
    return !routePayload || readStringProperty(routePayload, "source_event_type") !== "job.complete" ? null : isNonNullObject(routePayload.payload) ? routePayload.payload : null
}
