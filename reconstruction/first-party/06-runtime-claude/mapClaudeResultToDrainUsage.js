// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: mapClaudeResultToDrainUsage  (minified: kg, daemon.pretty.js:56429)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.5, v0.5.6, v0.8.4 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (high): The footer also shows which model was actually billed (served model may differ from the requested model). The footer reflects per-turn deltas, not process-global accumulators.
// changelog v0.8.4 (high): A resumed turn now reports its own figures. A session that existed before the upgrade has no saved baseline yet, so its first resume shows no cost and no model.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapClaudeResultToDrainUsage(resultMessage, costBaseline) {
    let result = resultMessage,
        usage = result.usage;
    if (!usage && typeof result.total_cost_usd != "number") return;
    let totalCostUsd = typeof result.total_cost_usd == "number" ? result.total_cost_usd : void 0,
        turnCostUsd;
    if (totalCostUsd === void 0 || costBaseline?.baselineUnknown) turnCostUsd = void 0;
    else if (typeof costBaseline?.prevTotalCostUsd == "number") {
        let costDelta = totalCostUsd - costBaseline.prevTotalCostUsd;
        turnCostUsd = costDelta >= 0 ? costDelta : void 0
    } else turnCostUsd = totalCostUsd;
    let isAnthropicProtocol = typeof usage?.cache_creation_input_tokens == "number";
    return {
        protocol: isAnthropicProtocol ? "anthropic" : void 0,
        model: costBaseline?.baselineUnknown ? void 0 : selectDominantModelByInputTokens(costBaseline ? Pat(costBaseline.prevModelUsage, result.modelUsage) : result.modelUsage),
        total_cost_usd: turnCostUsd,
        input_tokens: typeof usage?.input_tokens == "number" ? usage.input_tokens : void 0,
        output_tokens: typeof usage?.output_tokens == "number" ? usage.output_tokens : void 0,
        cache_creation_input_tokens: isAnthropicProtocol ? usage.cache_creation_input_tokens : void 0,
        cache_read_input_tokens: typeof usage?.cache_read_input_tokens == "number" ? usage.cache_read_input_tokens : void 0
    }
}
