// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: Bm, daemon.pretty.js:36767)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = [];
    for await (let i of Mle(e, t, n)) r.push(i);
    return r
}
