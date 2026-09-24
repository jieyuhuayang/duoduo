// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readClaudeAuthSourceEnv  (minified: Q6, daemon.pretty.js:89057)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readClaudeAuthSourceEnv(e = process.env) {
    let t = e.ALADUO_CLAUDE_AUTH_SOURCE ?? e.ALADUO_AUTH_SOURCE;
    return t && isClaudeAuthSource(t) ? t : void 0
}
