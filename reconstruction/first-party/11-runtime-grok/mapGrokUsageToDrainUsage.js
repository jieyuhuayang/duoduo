// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: mapGrokUsageToDrainUsage  (minified: zft, daemon.pretty.js:65461)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 12 renamed — 0 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (high): Token and cache accounting understands Grok's own reporting shape, so cost numbers stay comparable across the three.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapGrokUsageToDrainUsage(promptResult) {
    let meta = coerceToPlainObject(promptResult._meta),
        usage = coerceToPlainObject(meta.usage),
        inputTokens = zg(usage.inputTokens),
        outputTokens = zg(usage.outputTokens),
        totalTokens = zg(meta.totalTokens),
        contextUsedTokens = totalTokens !== void 0 && totalTokens > 0 ? totalTokens : void 0,
        costUsdTicks = zg(usage.costUsdTicks),
        totalCostUsd = costUsdTicks !== void 0 && costUsdTicks > 0 ? costUsdTicks / 1e10 : void 0,
        cachedReadTokens = zg(usage.cachedReadTokens),
        cacheCreationTokens = zg(usage.cacheCreationTokens),
        modelId = typeof meta.modelId == "string" ? meta.modelId : void 0;
    if (!(inputTokens === void 0 && outputTokens === void 0 && totalCostUsd === void 0 && cachedReadTokens === void 0 && cacheCreationTokens === void 0)) return {
        protocol: "grok",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_input_tokens: cachedReadTokens,
        cache_creation_input_tokens: cacheCreationTokens,
        context_used_tokens: contextUsedTokens,
        total_cost_usd: totalCostUsd,
        model: modelId
    }
}
