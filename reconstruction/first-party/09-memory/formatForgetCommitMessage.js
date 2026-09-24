// duoduo reconstruction — subsystem: 09-memory
// symbol: formatForgetCommitMessage  (minified: Uct, daemon.pretty.js:68518)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatForgetCommitMessage(e) {
    return e.length === 1 ? `forget: ${e[0].slug}, stale orphan never linked` : `forget: ${e.length} stale orphan memory nodes`
}
