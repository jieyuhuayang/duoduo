// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: Xce, daemon.pretty.js:56515)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t) {
    let n = fKe(e),
        r = pKe(t);
    for (let i = n.length - 1; i >= 0; i -= 1) {
        let s = n[i];
        if (r.has(s)) continue;
        let {
            count: o,
            hours: a
        } = mKe(Qce.join(e, `${s}.jsonl`));
        if (o === 0) continue;
        let u = hKe(a);
        return {
            gapDate: s,
            bands: u,
            selected: [{
                kind: ai.SCAN_GAP,
                partition: "memory-weaver",
                pendingFilename: "scan-gap.md.pending",
                pendingBody: yKe(s, u, o)
            }]
        }
    }
    return {
        gapDate: null,
        bands: [],
        selected: []
    }
}
