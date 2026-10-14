// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: warnUnmappedCodexItemOnce  (minified: _be, daemon.pretty.js:62847)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function warnUnmappedCodexItemOnce(phase, type) {
    let key = `${phase}:${type}`;
    ube.has(key) || (ube.add(key), logAlwaysAtLevel("info", "[codex] item/" + phase + " has no execution-event mapping — dropping silently", {
        phase,
        type
    }))
}
