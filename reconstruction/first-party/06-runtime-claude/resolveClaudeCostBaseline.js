// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveClaudeCostBaseline  (minified: Y$, daemon.pretty.js:55202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
