// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseChannelConfigFields  (minified: RI, daemon.pretty.js:37596)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.5, v0.5.0, v0.5.10, v0.8.4 (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (high): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseChannelConfigFields(frontmatter) {
    let timeGapMinutes = vq(frontmatter, df.time_gap_minutes),
        autoCompactIdleMinutes = vq(frontmatter, df.auto_compact_idle_minutes),
        autoCompactMinContextTokens = vq(frontmatter, df.auto_compact_min_context_tokens),
        stream = typeof frontmatter.stream == "boolean" ? frontmatter.stream : void 0,
        requireMention = typeof frontmatter.require_mention == "boolean" ? frontmatter.require_mention : void 0;
    return {
        new_session_workspace: zrt(frontmatter.new_session_workspace),
        prompt_mode: normalizePromptMode(frontmatter.prompt_mode),
        time_gap_minutes: timeGapMinutes,
        auto_compact_idle_minutes: autoCompactIdleMinutes,
        auto_compact_min_context_tokens: autoCompactMinContextTokens,
        stream,
        ...parseChannelRuntimeField(frontmatter.runtime),
        require_mention: requireMention,
        ...parseSdkConfigFrontmatter(frontmatter)
    }
}
