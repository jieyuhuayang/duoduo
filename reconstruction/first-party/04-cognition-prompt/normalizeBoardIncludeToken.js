// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeBoardIncludeToken  (minified: okt, daemon.pretty.js:84754)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeBoardIncludeToken(token) {
    if (!token) return;
    let [pathPart] = token.split("#");
    if (pathPart) return pathPart.replace(/\\ /g, " ")
}
