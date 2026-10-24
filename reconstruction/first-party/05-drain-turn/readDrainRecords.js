// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: wh, daemon.pretty.js:39144)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(paths, sessionKey, since) {
    let records = [];
    for await (let record of Yfe(paths, sessionKey, since)) records.push(record);
    return records
}
