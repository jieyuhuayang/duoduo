// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readGlobalUsageTotals  (minified: A1, daemon.pretty.js:35423)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readGlobalUsageTotals(e, t) {
 await ye(e.usageDir);
 let n;
 try {
  n = await Tk.readdir(e.usageDir)
 } catch {
  return summarizeDrainRecords([])
 }
 let r = summarizeDrainRecords([]);
 for (let i of n) {
  if (!i.endsWith(".jsonl")) continue;
  let o = i.slice(0, -6),
   s = await readDrainRecords(e, o, t)
   .catch(() => []),
   a = summarizeDrainRecords(s);
  r.total_drains += a.total_drains, r.total_tool_calls += a.total_tool_calls, r.total_tool_errors += a.total_tool_errors, r.total_output_chars += a.total_output_chars, r.total_drain_duration_ms += a.total_drain_duration_ms, r.total_sdk_duration_ms += a.total_sdk_duration_ms, r.total_cost_usd += a.total_cost_usd, r.total_input_tokens += a.total_input_tokens, r.total_output_tokens += a.total_output_tokens, r.total_cache_creation_tokens += a.total_cache_creation_tokens, r.total_cache_read_tokens += a.total_cache_read_tokens, r.cache_eligible_input_tokens += a.cache_eligible_input_tokens, r.cache_eligible_drains += a.cache_eligible_drains, r.cache.anthropic.drains += a.cache.anthropic.drains, r.cache.anthropic.cache_read_tokens += a.cache.anthropic.cache_read_tokens, r.cache.anthropic.cache_create_tokens += a.cache.anthropic.cache_create_tokens, r.cache.anthropic.fresh_input_tokens += a.cache.anthropic.fresh_input_tokens, r.cache.codex.drains += a.cache.codex.drains, r.cache.codex.input_tokens += a.cache.codex.input_tokens, r.cache.codex.cached_tokens += a.cache.codex.cached_tokens, r.cache.unsupported_drains += a.cache.unsupported_drains, a.last_drain_at && (!r.last_drain_at || a.last_drain_at > r.last_drain_at) && (r.last_drain_at = a.last_drain_at), r.perf.total_mailbox_merge_ms += a.perf.total_mailbox_merge_ms, r.perf.total_mailbox_parse_ms += a.perf.total_mailbox_parse_ms, r.perf.total_mailbox_render_ms += a.perf.total_mailbox_render_ms, r.perf.total_session_snapshot_ms += a.perf.total_session_snapshot_ms, r.perf.total_session_state_ms += a.perf.total_session_state_ms, r.perf.total_outbox_lookup_ms += a.perf.total_outbox_lookup_ms, r.perf.total_event_read_ms += a.perf.total_event_read_ms, r.perf.total_effective_config_ms += a.perf.total_effective_config_ms, r.perf.total_outbox_emit_ms += a.perf.total_outbox_emit_ms, r.perf.total_session_upsert_ms += a.perf.total_session_upsert_ms, r.perf.total_mailbox_finalize_ms += a.perf.total_mailbox_finalize_ms, r.perf.total_sdk_ttft_ms += a.perf.total_sdk_ttft_ms, r.perf.sdk_ttft_samples += a.perf.sdk_ttft_samples
 }
 return r
}
