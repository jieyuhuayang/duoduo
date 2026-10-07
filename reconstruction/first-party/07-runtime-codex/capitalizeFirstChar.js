// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: capitalizeFirstChar  (minified: mbe, daemon.pretty.js:62823)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function capitalizeFirstChar(e) {
    return e.length === 0 ? e : e[0].toUpperCase() + e.slice(1)
}
