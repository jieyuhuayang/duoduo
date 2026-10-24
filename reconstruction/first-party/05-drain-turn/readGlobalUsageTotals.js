// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readGlobalUsageTotals  (minified: Wq, daemon.pretty.js:39249)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): `usage.get` with `mode: "totals"` returns a single aggregate summary (~1KB vs ~230KB)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readGlobalUsageTotals(paths, since) {
    await ensureDirectoryExists(paths.usageDir);
    let fileNames;
    try {
        fileNames = await LI.readdir(paths.usageDir)
    } catch {
        return summarizeDrainRecords([])
    }
    let totals = summarizeDrainRecords([]);
    for (let fileName of fileNames) {
        if (!fileName.endsWith(".jsonl")) continue;
        let sessionKey = fileName.slice(0, -6),
            sessionSummary = await aggregateSessionDrainSummary(paths, sessionKey, since).catch(createEmptyUsageSummary);
        totals.total_drains += sessionSummary.total_drains, totals.total_tool_calls += sessionSummary.total_tool_calls, totals.total_tool_errors += sessionSummary.total_tool_errors, totals.total_output_chars += sessionSummary.total_output_chars, totals.total_drain_duration_ms += sessionSummary.total_drain_duration_ms, totals.total_sdk_duration_ms += sessionSummary.total_sdk_duration_ms, totals.total_cost_usd += sessionSummary.total_cost_usd, totals.total_input_tokens += sessionSummary.total_input_tokens, totals.total_output_tokens += sessionSummary.total_output_tokens, totals.total_cache_creation_tokens += sessionSummary.total_cache_creation_tokens, totals.total_cache_read_tokens += sessionSummary.total_cache_read_tokens, totals.cache_eligible_input_tokens += sessionSummary.cache_eligible_input_tokens, totals.cache_eligible_drains += sessionSummary.cache_eligible_drains, totals.cache.anthropic.drains += sessionSummary.cache.anthropic.drains, totals.cache.anthropic.cache_read_tokens += sessionSummary.cache.anthropic.cache_read_tokens, totals.cache.anthropic.cache_create_tokens += sessionSummary.cache.anthropic.cache_create_tokens, totals.cache.anthropic.fresh_input_tokens += sessionSummary.cache.anthropic.fresh_input_tokens, totals.cache.codex.drains += sessionSummary.cache.codex.drains, totals.cache.codex.input_tokens += sessionSummary.cache.codex.input_tokens, totals.cache.codex.cached_tokens += sessionSummary.cache.codex.cached_tokens, totals.cache.grok.drains += sessionSummary.cache.grok.drains, totals.cache.grok.input_tokens += sessionSummary.cache.grok.input_tokens, totals.cache.grok.cached_tokens += sessionSummary.cache.grok.cached_tokens, totals.cache.grok.cache_create_tokens += sessionSummary.cache.grok.cache_create_tokens, totals.cache.pi.drains += sessionSummary.cache.pi.drains, totals.cache.pi.cache_read_tokens += sessionSummary.cache.pi.cache_read_tokens, totals.cache.pi.cache_create_tokens += sessionSummary.cache.pi.cache_create_tokens, totals.cache.pi.fresh_input_tokens += sessionSummary.cache.pi.fresh_input_tokens, totals.cache.unsupported_drains += sessionSummary.cache.unsupported_drains, sessionSummary.last_drain_at && (!totals.last_drain_at || sessionSummary.last_drain_at > totals.last_drain_at) && (totals.last_drain_at = sessionSummary.last_drain_at), totals.perf.total_mailbox_merge_ms += sessionSummary.perf.total_mailbox_merge_ms, totals.perf.total_mailbox_parse_ms += sessionSummary.perf.total_mailbox_parse_ms, totals.perf.total_mailbox_render_ms += sessionSummary.perf.total_mailbox_render_ms, totals.perf.total_session_snapshot_ms += sessionSummary.perf.total_session_snapshot_ms, totals.perf.total_session_state_ms += sessionSummary.perf.total_session_state_ms, totals.perf.total_outbox_lookup_ms += sessionSummary.perf.total_outbox_lookup_ms, totals.perf.total_event_read_ms += sessionSummary.perf.total_event_read_ms, totals.perf.total_effective_config_ms += sessionSummary.perf.total_effective_config_ms, totals.perf.total_outbox_emit_ms += sessionSummary.perf.total_outbox_emit_ms, totals.perf.total_session_upsert_ms += sessionSummary.perf.total_session_upsert_ms, totals.perf.total_mailbox_finalize_ms += sessionSummary.perf.total_mailbox_finalize_ms, totals.perf.total_sdk_ttft_ms += sessionSummary.perf.total_sdk_ttft_ms, totals.perf.sdk_ttft_samples += sessionSummary.perf.sdk_ttft_samples
    }
    return totals
}
