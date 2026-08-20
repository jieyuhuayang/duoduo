// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: hpe, daemon.pretty.js:57867)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t) {
    let n = eXe(e),
        r = tXe(t);
    for (let i = n.length - 1; i >= 0; i -= 1) {
        let o = n[i];
        if (r.has(o)) continue;
        let {
            count: s,
            hours: a
        } = nXe(mpe.join(e, `${o}.jsonl`));
        if (s === 0) continue;
        let l = rXe(a);
        return {
            gapDate: o,
            bands: l,
            selected: [{
                kind: Si.SCAN_GAP,
                partition: "memory-weaver",
                pendingFilename: "scan-gap.md.pending",
                pendingBody: oXe(o, l, s)
            }]
        }
    }
    return {
        gapDate: null,
        bands: [],
        selected: []
    }
}
