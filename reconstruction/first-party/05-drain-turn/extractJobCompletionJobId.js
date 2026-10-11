// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractJobCompletionJobId  (minified: Zxe, daemon.pretty.js:72196)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 2 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobCompletionJobId(event) {
    let jobCompletePayload = extractJobCompletePayload(event);
    if (!jobCompletePayload) return null;
    let stringProperty = readStringProperty(jobCompletePayload, "job_id");
    return stringProperty && stringProperty.length > 0 ? stringProperty : null
}
