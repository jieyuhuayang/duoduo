// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: normalizeOptionalEnvString  (minified: Wf, daemon.pretty.js:56549)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeOptionalEnvString(value) {
    if (!value) return;
    let trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : void 0
}
