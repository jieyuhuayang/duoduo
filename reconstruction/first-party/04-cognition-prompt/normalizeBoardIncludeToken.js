// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeBoardIncludeToken  (minified: Sgt, daemon.pretty.js:82324)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeBoardIncludeToken(e) {
    if (!e) return;
    let [t] = e.split("#");
    if (t) return t.replace(/\\ /g, " ")
}
