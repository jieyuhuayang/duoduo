// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: CHANNEL_CONFIG_KEY_TYPES  (minified: eH, daemon.pretty.js:88302)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.10 (high): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var CHANNEL_CONFIG_KEY_TYPES = {
    new_session_workspace: "string",
    prompt_mode: "prompt_mode",
    time_gap_minutes: "nonneg_number",
    auto_compact_idle_minutes: "nonneg_number",
    auto_compact_min_context_tokens: "nonneg_number",
    stream: "boolean",
    runtime: "runtime",
    require_mention: "boolean",
    allowedTools: "string_array",
    disallowedTools: "string_array",
    additionalDirectories: "string_array",
    "claude.model": "model_id",
    "codex.model": "model_id",
    "pi.model": "model_id",
    "grok.model": "model_id",
    "claude.effort": "effort_level",
    "codex.effort": "effort_level",
    "pi.effort": "effort_level",
    "grok.effort": "effort_level"
};
