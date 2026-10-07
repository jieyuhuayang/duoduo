// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: ph, daemon.pretty.js:37062)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = [];
    for await (let i of ide(e, t, n)) r.push(i);
    return r
}
