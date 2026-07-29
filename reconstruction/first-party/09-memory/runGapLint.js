// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: ule, daemon.pretty.js:56637)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t) {
    let n = TKe(e),
        r = RKe(t);
    for (let i = n.length - 1; i >= 0; i -= 1) {
        let s = n[i];
        if (r.has(s)) continue;
        let {
            count: o,
            hours: a
        } = IKe(cle.join(e, `${s}.jsonl`));
        if (o === 0) continue;
        let c = PKe(a);
        return {
            gapDate: s,
            bands: c,
            selected: [{
                kind: oi.SCAN_GAP,
                partition: "memory-weaver",
                pendingFilename: "scan-gap.md.pending",
                pendingBody: OKe(s, c, o)
            }]
        }
    }
    return {
        gapDate: null,
        bands: [],
        selected: []
    }
}
