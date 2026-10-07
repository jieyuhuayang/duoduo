// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readLiveStreamContextToken  (minified: EN, daemon.pretty.js:82921)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readLiveStreamContextToken(e) {
    let t = e.streamingState;
    if (!(!t || t.closed)) return t.spawnMaxContextToken ?? null
}
