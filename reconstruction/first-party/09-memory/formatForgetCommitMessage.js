// duoduo reconstruction — subsystem: 09-memory
// symbol: formatForgetCommitMessage  (minified: Lft, daemon.pretty.js:68810)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatForgetCommitMessage(staleNodes) {
    return staleNodes.length === 1 ? `forget: ${staleNodes[0].slug}, stale orphan never linked` : `forget: ${staleNodes.length} stale orphan memory nodes`
}
