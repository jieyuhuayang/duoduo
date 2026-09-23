// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: mapGrokUsageToDrainUsage  (minified: Zst, daemon.pretty.js:63059)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mapGrokUsageToDrainUsage(e) {
    let t = $i(e._meta),
        n = $i(t.usage),
        r = ug(n.inputTokens),
        i = ug(n.outputTokens),
        o = ug(t.totalTokens),
        s = o !== void 0 && o > 0 ? o : void 0,
        a = ug(n.costUsdTicks),
        u = a !== void 0 && a > 0 ? a / 1e10 : void 0,
        l = ug(n.cachedReadTokens),
        c = ug(n.cacheCreationTokens),
        d = typeof t.modelId == "string" ? t.modelId : void 0;
    if (!(r === void 0 && i === void 0 && u === void 0 && l === void 0 && c === void 0)) return {
        protocol: "grok",
        input_tokens: r,
        output_tokens: i,
        cache_read_input_tokens: l,
        cache_creation_input_tokens: c,
        context_used_tokens: s,
        total_cost_usd: u,
        model: d
    }
}
