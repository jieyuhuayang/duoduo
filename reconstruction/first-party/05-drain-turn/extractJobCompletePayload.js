// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractJobCompletePayload  (minified: ike, daemon.pretty.js:71888)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobCompletePayload(e) {
    if (e.type !== "route.deliver") return null;
    let t = eo(e.payload) ? e.payload : void 0;
    return !t || en(t, "source_event_type") !== "job.complete" ? null : eo(t.payload) ? t.payload : null
}
