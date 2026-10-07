// duoduo reconstruction — subsystem: 09-memory
// symbol: formatForgetCommitMessage  (minified: Mft, daemon.pretty.js:68809)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (medium): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatForgetCommitMessage(e) {
    return e.length === 1 ? `forget: ${e[0].slug}, stale orphan never linked` : `forget: ${e.length} stale orphan memory nodes`
}
