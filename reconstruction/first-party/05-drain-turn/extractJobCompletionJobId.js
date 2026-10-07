// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractJobCompletionJobId  (minified: Zxe, daemon.pretty.js:72196)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobCompletionJobId(e) {
    let t = extractJobCompletePayload(e);
    if (!t) return null;
    let n = on(t, "job_id");
    return n && n.length > 0 ? n : null
}
