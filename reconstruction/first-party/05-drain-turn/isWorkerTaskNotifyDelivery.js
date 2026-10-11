// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isWorkerTaskNotifyDelivery  (minified: Jxe, daemon.pretty.js:72182)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (high): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isWorkerTaskNotifyDelivery(event) {
    if (event.type !== "route.deliver") return !1;
    let routePayload = isNonNullObject(event.payload) ? event.payload : void 0;
    if (!routePayload || readStringProperty(routePayload, "source_event_type") !== "notify") return !1;
    let innerPayload = isNonNullObject(routePayload.payload) ? routePayload.payload : void 0;
    return innerPayload ? typeof innerPayload.task_id == "string" && innerPayload.task_id.length > 0 : !1
}
