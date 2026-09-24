// duoduo reconstruction — subsystem: 09-memory
// symbol: renderHotOrphansSection  (minified: hct, daemon.pretty.js:68001)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderHotOrphansSection(e, t) {
    let n = ["", "hot orphans (touched, but outside the board closure; both trees):"];
    if (e.length === 0) return n.push("(none -- every file touched this window is reachable from the board)"), n;
    for (let r of e) n.push(`- ${r.rel} | ${r.touches} touches`);
    return t > e.length && n.push(`(+${t-e.length} more, capped at ${nwe})`), n.push("direction: gradient is flowing outside the wiring and in use right now, so the board is", "MISSING gradient it demonstrably should carry -- wire it in, through a board line or a", "link from a dossier the board already reaches. Or judge the reads incidental and leave", 'it. One caveat this window cannot settle for you: it cannot tell "used while orphaned"', 'from "used before a deliberate unlink earlier in the same window", so a recent', "deliberate retirement is not miswiring."), n
}
