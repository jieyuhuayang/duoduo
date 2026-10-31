// duoduo reconstruction — subsystem: 09-memory
// symbol: countNewlineChars  (minified: XO, daemon.pretty.js:68006)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function countNewlineChars(text) {
    let count = 0;
    for (let i = 0; i < text.length; i++) text[i] === `
` && count++;
    return count
}
