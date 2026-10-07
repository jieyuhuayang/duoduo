// duoduo reconstruction — subsystem: 09-memory
// symbol: countDatedStampLines  (minified: $we, daemon.pretty.js:66800)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function countDatedStampLines(e) {
    let t = /2026-\d{2}-\d{2}|20260\d{3}/,
        n = 0;
    for (let r of Jo(e)) t.test(r) && n++;
    return n
}
