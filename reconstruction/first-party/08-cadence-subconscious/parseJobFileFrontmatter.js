// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseJobFileFrontmatter  (minified: Kve, daemon.pretty.js:63638)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.6.2, v0.7.0, v0.8.1 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.2 (medium): A job's frontmatter now accepts `prompt_mode`, `allowedTools`, `disallowedTools`, `additionalDirectories` and a nested `claude: { tools }`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseJobFileFrontmatter(source, jobLabel) {
    let parsed = (0, Yve.default)(source, kr),
        rawData = parsed.data ?? {},
        sdkConfigFrontmatter = parseSdkConfigFrontmatter(rawData),
        promptMode = normalizePromptMode(rawData.prompt_mode),
        data = {
            ...rawData
        };
    for (let key of pft) delete data[key];
    promptMode && (data.prompt_mode = promptMode), data.effort !== void 0 && !(typeof data.effort == "string" && isEffortLevel(data.effort)) && (logWarnMessage("[JobManager] ignoring invalid job effort", {
        job: jobLabel ?? "(unknown job file)",
        effort: typeof data.effort == "string" ? data.effort : typeof data.effort,
        accepted: Hi.join(", ")
    }), delete data.effort);
    for (let [key, value] of Object.entries(sdkConfigFrontmatter)) value !== void 0 && (data[key] = value);
    return {
        data,
        content: parsed.content
    }
}
