// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: isBoardIncludePathCandidate  (minified: kgt, daemon.pretty.js:82330)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isBoardIncludePathCandidate(e) {
    return e.startsWith("./") || e.startsWith("~/") || ha.isAbsolute(e) && e !== ha.parse(e).root || !e.startsWith("@") && !/^[#%^&*()]+/.test(e) && /^[a-zA-Z0-9._-]/.test(e)
}
