// duoduo reconstruction — subsystem: 03-session-actor
// symbol: extractJobSdkConfig  (minified: Xve, daemon.pretty.js:63677)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 10 renamed — 9 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobSdkConfig(sdkConfig) {
    if (!sdkConfig) return;
    let {
        prompt_mode: promptMode,
        allowedTools,
        disallowedTools,
        additionalDirectories,
        claudeTools,
        claudeModelProfiles,
        claudeModelProfileIssues,
        claudeModelAliases,
        claudeModelAliasIssues
    } = sdkConfig;
    if (!(promptMode === void 0 && allowedTools === void 0 && disallowedTools === void 0 && additionalDirectories === void 0 && claudeTools === void 0 && claudeModelProfiles === void 0 && claudeModelProfileIssues === void 0 && claudeModelAliases === void 0 && claudeModelAliasIssues === void 0)) return {
        prompt_mode: promptMode,
        allowedTools,
        disallowedTools,
        additionalDirectories,
        claudeTools,
        claudeModelProfiles,
        claudeModelProfileIssues,
        claudeModelAliases,
        claudeModelAliasIssues
    }
}
