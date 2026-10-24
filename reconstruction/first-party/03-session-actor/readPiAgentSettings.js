// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readPiAgentSettings  (minified: HS, daemon.pretty.js:75535)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 3 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): A pi worker was torn down and rebuilt when its settings file merely failed to *read* — a transient error was treated as "not configured".
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readPiAgentSettings(agentDir) {
    let settingsSeed = {},
        projectTrust = "ask",
        unknownKeys = [],
        readFailed = !1,
        rawSettings;
    try {
        rawSettings = $bt(rRe.join(agentDir, "settings.json"), "utf-8")
    } catch (err) {
        err?.code !== "ENOENT" && (readFailed = !0)
    }
    if (rawSettings !== void 0) try {
        let parsed = JSON.parse(rawSettings),
            splitSettings = tRe(parsed);
        settingsSeed = splitSettings.seed, unknownKeys = splitSettings.unknown;
        let defaultProjectTrust = parsed.defaultProjectTrust;
        (defaultProjectTrust === "always" || defaultProjectTrust === "never" || defaultProjectTrust === "ask") && (projectTrust = defaultProjectTrust)
    } catch {}
    return {
        settingsSeed,
        defaultProjectTrust: projectTrust,
        unknownKeys,
        readFailed
    }
}
