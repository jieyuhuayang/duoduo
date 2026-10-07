// duoduo reconstruction — subsystem: 09-memory
// symbol: buildSafeDirectoryGitArgs  (minified: $ke, daemon.pretty.js:69270)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSafeDirectoryGitArgs(e, t) {
    return ["-c", `safe.directory=${e}`, ...t]
}
