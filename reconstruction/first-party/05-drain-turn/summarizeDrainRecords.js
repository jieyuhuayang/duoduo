// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: summarizeDrainRecords  (minified: yl, daemon.pretty.js:35345)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function summarizeDrainRecords(e) {
 let t = {
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
 };
 for (let n of e) {
  if (t.total_drains += 1, t.total_tool_calls += n.tool_calls, t.total_tool_errors += n.tool_errors, t.total_output_chars += n.output_chars, t.total_drain_duration_ms += n.drain_duration_ms, t.total_sdk_duration_ms += n.sdk_duration_ms, n.usage) {
   t.total_cost_usd += n.usage.total_cost_usd ?? 0, t.total_input_tokens += n.usage.input_tokens ?? 0, t.total_output_tokens += n.usage.output_tokens ?? 0, t.total_cache_creation_tokens += n.usage.cache_creation_input_tokens ?? 0, t.total_cache_read_tokens += n.usage.cache_read_input_tokens ?? 0;
   let r = typeof n.usage.cache_read_input_tokens == "number",
    i = typeof n.usage.cache_creation_input_tokens == "number";
   (r || i) && (t.cache_eligible_input_tokens += n.usage.input_tokens ?? 0, t.cache_eligible_drains += 1);
   let o = n.usage.protocol;
   o === "anthropic" ? (t.cache.anthropic.drains += 1, t.cache.anthropic.cache_read_tokens += n.usage.cache_read_input_tokens ?? 0, t.cache.anthropic.cache_create_tokens += n.usage.cache_creation_input_tokens ?? 0, t.cache.anthropic.fresh_input_tokens += n.usage.input_tokens ?? 0) : o === "codex" ? (t.cache.codex.drains += 1, t.cache.codex.input_tokens += n.usage.input_tokens ?? 0, t.cache.codex.cached_tokens += n.usage.cache_read_input_tokens ?? 0) : (r || i) && (t.cache.unsupported_drains += 1)
  }
  n.perf && (t.perf.total_mailbox_merge_ms += n.perf.mailbox_merge_ms ?? 0, t.perf.total_mailbox_parse_ms += n.perf.mailbox_parse_ms ?? 0, t.perf.total_mailbox_render_ms += n.perf.mailbox_render_ms ?? 0, t.perf.total_session_snapshot_ms += n.perf.session_snapshot_ms ?? 0, t.perf.total_session_state_ms += n.perf.session_state_ms ?? 0, t.perf.total_outbox_lookup_ms += n.perf.outbox_lookup_ms ?? 0, t.perf.total_event_read_ms += n.perf.event_read_ms ?? 0, t.perf.total_effective_config_ms += n.perf.effective_config_ms ?? 0, t.perf.total_outbox_emit_ms += n.perf.outbox_emit_ms ?? 0, t.perf.total_session_upsert_ms += n.perf.session_upsert_ms ?? 0, t.perf.total_mailbox_finalize_ms += n.perf.mailbox_finalize_ms ?? 0, t.perf.total_sdk_ttft_ms += n.perf.sdk_ttft_ms_total ?? 0, t.perf.sdk_ttft_samples += n.perf.sdk_ttft_samples ?? 0), (!t.last_drain_at || n.drain_started_at > t.last_drain_at) && (t.last_drain_at = n.drain_started_at)
 }
 return t
}
