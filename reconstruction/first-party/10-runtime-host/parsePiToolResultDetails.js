// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parsePiToolResultDetails  (minified: mEe, daemon.pretty.js:73651)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Fourth peer behind the same seam as the other three: duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePiToolResultDetails(resultJson) {
    try {
        let parsed = JSON.parse(resultJson);
        if (typeof parsed?.details == "object" && parsed.details !== null) return parsed.details
    } catch {}
}
