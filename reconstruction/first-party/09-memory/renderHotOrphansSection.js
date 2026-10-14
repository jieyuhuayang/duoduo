// duoduo reconstruction — subsystem: 09-memory
// symbol: renderHotOrphansSection  (minified: fft, daemon.pretty.js:68293)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderHotOrphansSection(orphans, totalCount) {
    let lines = ["", "hot orphans (touched, but outside the board closure; both trees):"];
    if (orphans.length === 0) return lines.push("(none -- every file touched this window is reachable from the board)"), lines;
    for (let orphan of orphans) lines.push(`- ${orphan.rel} | ${orphan.touches} touches`);
    return totalCount > orphans.length && lines.push(`(+${totalCount-orphans.length} more, capped at ${wSe})`), lines.push("direction: gradient is flowing outside the wiring and in use right now, so the board is", "MISSING gradient it demonstrably should carry -- wire it in, through a board line or a", "link from a dossier the board already reaches. Or judge the reads incidental and leave", 'it. One caveat this window cannot settle for you: it cannot tell "used while orphaned"', 'from "used before a deliberate unlink earlier in the same window", so a recent', "deliberate retirement is not miswiring."), lines
}
