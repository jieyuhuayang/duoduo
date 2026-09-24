// duoduo reconstruction — subsystem: 09-memory
// symbol: mergeContiguousHourRanges  (minified: Bve, daemon.pretty.js:67624)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeContiguousHourRanges(e) {
    let t = [...e].sort((r, i) => r - i),
        n = [];
    for (let r of t) {
        let i = n[n.length - 1];
        i && r === i[1] + 1 ? i[1] = r : n.push([r, r])
    }
    return n
}
