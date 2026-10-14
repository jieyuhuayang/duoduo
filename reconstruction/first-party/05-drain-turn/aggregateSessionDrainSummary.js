// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: aggregateSessionDrainSummary  (minified: ade, daemon.pretty.js:37145)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): The dashboard streams usage summaries
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function aggregateSessionDrainSummary(paths, sessionKey, since) {
    let emptyUsageSummary = createEmptyUsageSummary();
    for await (let record of ode(paths, sessionKey, since)) accumulateDrainRecordIntoSummary(emptyUsageSummary, record);
    return emptyUsageSummary
}
