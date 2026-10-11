// duoduo reconstruction — subsystem: 03-session-actor
// symbol: snapshotInflightEventIds  (minified: ZRe, daemon.pretty.js:83158)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function snapshotInflightEventIds(actor) {
    let snapshot;
    for (let eventId of actor.inflightEventIds)(snapshot ??= new Set).add(eventId);
    return snapshot
}
