// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatModelConfigIssues  (minified: pK, daemon.pretty.js:93135)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatModelConfigIssues(issues) {
    if (!(!issues || issues.length === 0)) return issues.map(issue => ({
        model: issue.model,
        reason: issue.reason,
        layer: issue.layer
    }))
}
