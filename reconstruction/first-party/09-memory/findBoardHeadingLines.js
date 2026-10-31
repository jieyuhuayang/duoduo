// duoduo reconstruction — subsystem: 09-memory
// symbol: findBoardHeadingLines  (minified: Jmt, daemon.pretty.js:69746)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findBoardHeadingLines(text) {
    let headings = [],
        parts = text.split(`
`),
        inFence = !1;
    for (let index = 0; index < parts.length; index += 1) {
        if (Wmt.test(parts[index])) {
            inFence = !inFence;
            continue
        }
        inFence || Hmt.test(parts[index]) && headings.push({
            line: index + 1,
            text: parts[index]
        })
    }
    return headings
}
