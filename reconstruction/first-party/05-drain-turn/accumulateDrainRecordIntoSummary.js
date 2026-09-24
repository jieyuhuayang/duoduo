// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: accumulateDrainRecordIntoSummary  (minified: Lle, daemon.pretty.js:36833)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function accumulateDrainRecordIntoSummary(e, t) {
    if (e.total_drains += 1, e.total_tool_calls += t.tool_calls, e.total_tool_errors += t.tool_errors, e.total_output_chars += t.output_chars, e.total_drain_duration_ms += t.drain_duration_ms, e.total_sdk_duration_ms += t.sdk_duration_ms, t.usage) {
        e.total_cost_usd += t.usage.total_cost_usd ?? 0, e.total_input_tokens += t.usage.input_tokens ?? 0, e.total_output_tokens += t.usage.output_tokens ?? 0, e.total_cache_creation_tokens += t.usage.cache_creation_input_tokens ?? 0, e.total_cache_read_tokens += t.usage.cache_read_input_tokens ?? 0;
        let n = typeof t.usage.cache_read_input_tokens == "number",
            r = typeof t.usage.cache_creation_input_tokens == "number";
        (n || r) && (e.cache_eligible_input_tokens += t.usage.input_tokens ?? 0, e.cache_eligible_drains += 1);
        let i = t.usage.protocol;
        i === "anthropic" ? (e.cache.anthropic.drains += 1, e.cache.anthropic.cache_read_tokens += t.usage.cache_read_input_tokens ?? 0, e.cache.anthropic.cache_create_tokens += t.usage.cache_creation_input_tokens ?? 0, e.cache.anthropic.fresh_input_tokens += t.usage.input_tokens ?? 0) : i === "codex" ? (e.cache.codex.drains += 1, e.cache.codex.input_tokens += t.usage.input_tokens ?? 0, e.cache.codex.cached_tokens += t.usage.cache_read_input_tokens ?? 0) : i === "grok" ? (e.cache.grok.drains += 1, e.cache.grok.input_tokens += t.usage.input_tokens ?? 0, e.cache.grok.cached_tokens += t.usage.cache_read_input_tokens ?? 0, e.cache.grok.cache_create_tokens += t.usage.cache_creation_input_tokens ?? 0) : i === "pi" ? (e.cache.pi.drains += 1, e.cache.pi.cache_read_tokens += t.usage.cache_read_input_tokens ?? 0, e.cache.pi.cache_create_tokens += t.usage.cache_creation_input_tokens ?? 0, e.cache.pi.fresh_input_tokens += t.usage.input_tokens ?? 0) : (n || r) && (e.cache.unsupported_drains += 1)
    }
    t.perf && (e.perf.total_mailbox_merge_ms += t.perf.mailbox_merge_ms ?? 0, e.perf.total_mailbox_parse_ms += t.perf.mailbox_parse_ms ?? 0, e.perf.total_mailbox_render_ms += t.perf.mailbox_render_ms ?? 0, e.perf.total_session_snapshot_ms += t.perf.session_snapshot_ms ?? 0, e.perf.total_session_state_ms += t.perf.session_state_ms ?? 0, e.perf.total_outbox_lookup_ms += t.perf.outbox_lookup_ms ?? 0, e.perf.total_event_read_ms += t.perf.event_read_ms ?? 0, e.perf.total_effective_config_ms += t.perf.effective_config_ms ?? 0, e.perf.total_outbox_emit_ms += t.perf.outbox_emit_ms ?? 0, e.perf.total_session_upsert_ms += t.perf.session_upsert_ms ?? 0, e.perf.total_mailbox_finalize_ms += t.perf.mailbox_finalize_ms ?? 0, e.perf.total_sdk_ttft_ms += t.perf.sdk_ttft_ms_total ?? 0, e.perf.sdk_ttft_samples += t.perf.sdk_ttft_samples ?? 0), (!e.last_drain_at || t.drain_started_at > e.last_drain_at) && (e.last_drain_at = t.drain_started_at)
}
