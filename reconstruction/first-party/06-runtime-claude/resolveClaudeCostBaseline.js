// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveClaudeCostBaseline  (minified: Y$, daemon.pretty.js:55202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): A resumed turn now reports its own figures. A session that existed before the upgrade has no saved baseline yet, so its first resume shows no cost and no model.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveClaudeCostBaseline(sdkSessionId, costBaseline) {
    if (sdkSessionId) return costBaseline?.sdk_session_id === sdkSessionId ? {
        prevTotalCostUsd: costBaseline.total_cost_usd,
        prevModelUsage: costBaseline.model_usage
    } : {
        baselineUnknown: !0
    }
}
