// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: mapClaudeResultToDrainUsage  (minified: Vh, daemon.pretty.js:54880)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapClaudeResultToDrainUsage(e, t) {
    let n = e,
        r = n.usage;
    if (!r && typeof n.total_cost_usd != "number") return;
    let i = typeof n.total_cost_usd == "number" ? n.total_cost_usd : void 0,
        o;
    if (i === void 0) o = void 0;
    else if (typeof t?.prevTotalCostUsd == "number") {
        let a = i - t.prevTotalCostUsd;
        o = a >= 0 ? a : void 0
    } else o = i;
    let s = typeof r?.cache_creation_input_tokens == "number";
    return {
        protocol: s ? "anthropic" : void 0,
        model: selectDominantModelByInputTokens(t ? yrt(t.prevModelUsage, n.modelUsage) : n.modelUsage),
        total_cost_usd: o,
        input_tokens: typeof r?.input_tokens == "number" ? r.input_tokens : void 0,
        output_tokens: typeof r?.output_tokens == "number" ? r.output_tokens : void 0,
        cache_creation_input_tokens: s ? r.cache_creation_input_tokens : void 0,
        cache_read_input_tokens: typeof r?.cache_read_input_tokens == "number" ? r.cache_read_input_tokens : void 0
    }
}
