// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseChannelConfigFields  (minified: CR, daemon.pretty.js:35388)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseChannelConfigFields(e) {
    let t = Fz(e, Jd.time_gap_minutes),
        n = Fz(e, Jd.auto_compact_idle_minutes),
        r = Fz(e, Jd.auto_compact_min_context_tokens),
        i = typeof e.stream == "boolean" ? e.stream : void 0,
        o = typeof e.require_mention == "boolean" ? e.require_mention : void 0;
    return {
        new_session_workspace: W7e(e.new_session_workspace),
        prompt_mode: normalizePromptMode(e.prompt_mode),
        time_gap_minutes: t,
        auto_compact_idle_minutes: n,
        auto_compact_min_context_tokens: r,
        stream: i,
        runtime: Q7e(e.runtime),
        require_mention: o,
        ...Vz(e)
    }
}
