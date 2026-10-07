// duoduo reconstruction — subsystem: 09-memory
// symbol: extractBoardSlugLinks  (minified: yft, daemon.pretty.js:68482)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractBoardSlugLinks(e) {
    let t = [],
        n = e.split(`
`);
    for (let r = 0; r < n.length; r += 1)
        for (let i of n[r].matchAll(gft)) {
            let o = i[1]?.trim() ?? "";
            t.push({
                slug: o,
                line: r + 1
            })
        }
    return t
}
