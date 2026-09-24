// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: CHANNEL_CONFIG_KEY_TYPES  (minified: t6, daemon.pretty.js:87923)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
