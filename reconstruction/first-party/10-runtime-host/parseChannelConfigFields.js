// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseChannelConfigFields  (minified: cI, daemon.pretty.js:35514)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.5, v0.5.0, v0.5.10, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.10 (high): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseChannelConfigFields(e) {
    let t = zU(e, of.time_gap_minutes),
        n = zU(e, of.auto_compact_idle_minutes),
        r = zU(e, of.auto_compact_min_context_tokens),
        i = typeof e.stream == "boolean" ? e.stream : void 0,
        o = typeof e.require_mention == "boolean" ? e.require_mention : void 0;
    return {
        new_session_workspace: FQe(e.new_session_workspace),
        prompt_mode: normalizePromptMode(e.prompt_mode),
        time_gap_minutes: t,
        auto_compact_idle_minutes: n,
        auto_compact_min_context_tokens: r,
        stream: i,
        ...parseChannelRuntimeField(e.runtime),
        require_mention: o,
        ...parseSdkConfigFrontmatter(e)
    }
}
