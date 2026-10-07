// duoduo reconstruction — subsystem: 09-memory
// symbol: filterOrphanIslands  (minified: DSe, daemon.pretty.js:68756)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function filterOrphanIslands(e) {
    return e.filter(t => t.indeg >= 1)
}
