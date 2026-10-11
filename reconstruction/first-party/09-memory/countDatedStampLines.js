// duoduo reconstruction — subsystem: 09-memory
// symbol: countDatedStampLines  (minified: $we, daemon.pretty.js:66800)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function countDatedStampLines(text) {
    let datePattern = /2026-\d{2}-\d{2}|20260\d{3}/,
        count = 0;
    for (let line of splitLinesDropTrailingEmpty(text)) datePattern.test(line) && count++;
    return count
}
