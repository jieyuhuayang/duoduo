// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildClaudeCostBaseline  (minified: mC, daemon.pretty.js:56461)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): A resumed turn now reports its own figures. A session that existed before the upgrade has no saved baseline yet, so its first resume shows no cost and no model.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildClaudeCostBaseline(sdkSessionId, totalCostUsd, modelUsage) {
    if (!(!sdkSessionId || typeof totalCostUsd != "number") && !(!modelUsage || typeof modelUsage != "object")) return {
        sdk_session_id: sdkSessionId,
        total_cost_usd: totalCostUsd,
        model_usage: modelUsage
    }
}
