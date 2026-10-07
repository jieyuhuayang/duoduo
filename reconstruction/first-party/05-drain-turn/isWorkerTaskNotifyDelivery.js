// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isWorkerTaskNotifyDelivery  (minified: Jxe, daemon.pretty.js:72182)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isWorkerTaskNotifyDelivery(e) {
    if (e.type !== "route.deliver") return !1;
    let t = to(e.payload) ? e.payload : void 0;
    if (!t || on(t, "source_event_type") !== "notify") return !1;
    let n = to(t.payload) ? t.payload : void 0;
    return n ? typeof n.task_id == "string" && n.task_id.length > 0 : !1
}
