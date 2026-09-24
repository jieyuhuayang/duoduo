// duoduo reconstruction — subsystem: 09-memory
// symbol: scanWikiLinkOccurrences  (minified: Lf, daemon.pretty.js:66493)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function scanWikiLinkOccurrences(e) {
    let t = [],
        n = e.length,
        r = 0;
    for (; r < n;) {
        if (e[r] === "[" && r + 1 < n && e[r + 1] === "[") {
            let i = r,
                o = r + 2;
            for (; o < n && e[o] !== "]";) o++;
            if (o + 1 < n && e[o] === "]" && e[o + 1] === "]") {
                let s = e.slice(i + 2, o);
                s.length > 0 && t.push({
                    slug: s,
                    index: i
                }), r = o + 2;
                continue
            }
            r = i + 1;
            continue
        }
        r++
    }
    return t
}
