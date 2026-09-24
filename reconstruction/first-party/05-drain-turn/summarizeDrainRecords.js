// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: summarizeDrainRecords  (minified: Cb, daemon.pretty.js:36845)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function summarizeDrainRecords(e) {
    let t = VR();
    for (let n of e) accumulateDrainRecordIntoSummary(t, n);
    return t
}
