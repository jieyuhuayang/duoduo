// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveClaudeCostBaseline  (minified: Y$, daemon.pretty.js:55202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (high): A resumed turn now reports its own figures. A session that existed before the upgrade has no saved baseline yet, so its first resume shows no cost and no model.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveClaudeCostBaseline(e, t) {
    if (e) return t?.sdk_session_id === e ? {
        prevTotalCostUsd: t.total_cost_usd,
        prevModelUsage: t.model_usage
    } : {
        baselineUnknown: !0
    }
}
