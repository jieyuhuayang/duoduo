// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: aggregateSessionDrainSummary  (minified: sde, daemon.pretty.js:37145)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.2 (medium): The dashboard streams usage summaries
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function aggregateSessionDrainSummary(e, t, n) {
    let r = createEmptyUsageSummary();
    for await (let i of ide(e, t, n)) accumulateDrainRecordIntoSummary(r, i);
    return r
}
