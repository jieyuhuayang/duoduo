// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: summarizeDrainRecords  (minified: ev, daemon.pretty.js:37140)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function summarizeDrainRecords(records) {
    let emptyUsageSummary = createEmptyUsageSummary();
    for (let record of records) accumulateDrainRecordIntoSummary(emptyUsageSummary, record);
    return emptyUsageSummary
}
