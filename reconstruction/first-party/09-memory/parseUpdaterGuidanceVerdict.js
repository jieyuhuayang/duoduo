// duoduo reconstruction — subsystem: 09-memory
// symbol: parseUpdaterGuidanceVerdict  (minified: ult, daemon.pretty.js:66665)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseUpdaterGuidanceVerdict(e) {
    let t = !1;
    for (let n of Bo(e)) {
        if (/updater guidance:/i.test(n)) {
            t = !0;
            continue
        }
        if (!t || !/^- /.test(n)) continue;
        let r = n.toUpperCase(),
            i = null,
            o = Number.POSITIVE_INFINITY;
        for (let s of olt) {
            let a = r.indexOf(s);
            a >= 0 && a < o && (o = a, i = s)
        }
        if (i !== null) return i
    }
    return null
}
