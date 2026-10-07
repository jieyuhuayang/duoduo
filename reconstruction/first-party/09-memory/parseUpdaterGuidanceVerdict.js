// duoduo reconstruction — subsystem: 09-memory
// symbol: parseUpdaterGuidanceVerdict  (minified: ndt, daemon.pretty.js:66937)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseUpdaterGuidanceVerdict(e) {
    let t = !1;
    for (let n of splitLinesDropTrailingEmpty(e)) {
        if (/updater guidance:/i.test(n)) {
            t = !0;
            continue
        }
        if (!t || !/^- /.test(n)) continue;
        let r = n.toUpperCase(),
            i = null,
            o = Number.POSITIVE_INFINITY;
        for (let s of Qct) {
            let a = r.indexOf(s);
            a >= 0 && a < o && (o = a, i = s)
        }
        if (i !== null) return i
    }
    return null
}
