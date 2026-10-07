// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseJobFileFrontmatter  (minified: tbe, daemon.pretty.js:61555)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseJobFileFrontmatter(e, t) {
    let n = (0, nbe.default)(e, Sr),
        r = n.data ?? {},
        i = parseSdkConfigFrontmatter(r),
        o = normalizePromptMode(r.prompt_mode),
        s = {
            ...r
        };
    for (let a of hut) delete s[a];
    o && (s.prompt_mode = o), s.effort !== void 0 && !(typeof s.effort == "string" && isEffortLevel(s.effort)) && (logWarnMessage("[JobManager] ignoring invalid job effort", {
        job: t ?? "(unknown job file)",
        effort: typeof s.effort == "string" ? s.effort : typeof s.effort,
        accepted: qi.join(", ")
    }), delete s.effort);
    for (let [a, u] of Object.entries(i)) u !== void 0 && (s[a] = u);
    return {
        data: s,
        content: n.content
    }
}
