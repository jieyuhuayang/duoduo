// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatModelConfigIssues  (minified: NG, daemon.pretty.js:91627)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatModelConfigIssues(e) {
    if (!(!e || e.length === 0)) return e.map(t => ({
        model: t.model,
        reason: t.reason,
        layer: t.layer
    }))
}
