// duoduo reconstruction — subsystem: 09-memory
// symbol: rankEffectivenessTrajectory  (minified: Dwe, daemon.pretty.js:66976)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function rankEffectivenessTrajectory(e) {
    switch (e) {
        case "WEAKENING":
            return 3;
        case "NEUTRAL":
            return 2;
        case "STRENGTHENING":
            return 1;
        default:
            return 0
    }
}
