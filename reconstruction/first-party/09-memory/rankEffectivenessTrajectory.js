// duoduo reconstruction — subsystem: 09-memory
// symbol: rankEffectivenessTrajectory  (minified: QSe, daemon.pretty.js:68175)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function rankEffectivenessTrajectory(trajectory) {
    switch (trajectory) {
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
