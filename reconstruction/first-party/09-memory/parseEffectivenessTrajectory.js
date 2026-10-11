// duoduo reconstruction — subsystem: 09-memory
// symbol: parseEffectivenessTrajectory  (minified: edt, daemon.pretty.js:66908)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEffectivenessTrajectory(text) {
    for (let line of splitLinesDropTrailingEmpty(text)) {
        let match = /^trajectory:\s*(.+?)\s*$/i.exec(line);
        if (!match) continue;
        let value = match[1].toUpperCase();
        return value.startsWith("STRENGTHEN") ? "STRENGTHENING" : value.startsWith("WEAKEN") ? "WEAKENING" : (value.startsWith("NEUTRAL"), "NEUTRAL")
    }
    return "NO-EFF"
}
