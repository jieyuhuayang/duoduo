// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildClaudeCostBaseline  (minified: X$, daemon.pretty.js:55211)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildClaudeCostBaseline(e, t, n) {
    if (!(!e || typeof t != "number") && !(!n || typeof n != "object")) return {
        sdk_session_id: e,
        total_cost_usd: t,
        model_usage: n
    }
}
