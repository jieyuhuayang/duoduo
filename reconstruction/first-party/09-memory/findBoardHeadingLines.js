// duoduo reconstruction — subsystem: 09-memory
// symbol: findBoardHeadingLines  (minified: Pft, daemon.pretty.js:68548)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findBoardHeadingLines(text) {
    let headings = [],
        parts = text.split(`
`),
        inFence = !1;
    for (let i = 0; i < parts.length; i += 1) {
        if (Tft.test(parts[i])) {
            inFence = !inFence;
            continue
        }
        inFence || Ift.test(parts[i]) && headings.push({
            line: i + 1,
            text: parts[i]
        })
    }
    return headings
}
