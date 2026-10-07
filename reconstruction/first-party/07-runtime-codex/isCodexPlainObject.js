// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: isCodexPlainObject  (minified: qw, daemon.pretty.js:62768)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isCodexPlainObject(e) {
    return typeof e == "object" && e !== null && !Array.isArray(e)
}
