// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeBoardIncludeToken  (minified: obt, daemon.pretty.js:82626)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeBoardIncludeToken(e) {
    if (!e) return;
    let [t] = e.split("#");
    if (t) return t.replace(/\\ /g, " ")
}
