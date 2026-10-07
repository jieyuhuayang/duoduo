// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: createEmptyUsageSummary  (minified: kI, daemon.pretty.js:37068)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createEmptyUsageSummary() {
    return {
        total_drains: 0,
        total_tool_calls: 0,
        total_tool_errors: 0,
        total_output_chars: 0,
        total_drain_duration_ms: 0,
        total_sdk_duration_ms: 0,
        total_cost_usd: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cache_creation_tokens: 0,
        total_cache_read_tokens: 0,
        cache_eligible_input_tokens: 0,
        cache_eligible_drains: 0,
        cache: {
            anthropic: {
                drains: 0,
                cache_read_tokens: 0,
                cache_create_tokens: 0,
                fresh_input_tokens: 0
            },
            codex: {
                drains: 0,
                input_tokens: 0,
                cached_tokens: 0
            },
            grok: {
                drains: 0,
                input_tokens: 0,
                cached_tokens: 0,
                cache_create_tokens: 0
            },
            pi: {
                drains: 0,
                cache_read_tokens: 0,
                cache_create_tokens: 0,
                fresh_input_tokens: 0
            },
            unsupported_drains: 0
        },
        last_drain_at: void 0,
        perf: {
            total_mailbox_merge_ms: 0,
            total_mailbox_parse_ms: 0,
            total_mailbox_render_ms: 0,
            total_session_snapshot_ms: 0,
            total_session_state_ms: 0,
            total_outbox_lookup_ms: 0,
            total_event_read_ms: 0,
            total_effective_config_ms: 0,
            total_outbox_emit_ms: 0,
            total_session_upsert_ms: 0,
            total_mailbox_finalize_ms: 0,
            total_sdk_ttft_ms: 0,
            sdk_ttft_samples: 0
        }
    }
}
