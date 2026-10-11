// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: applyJobSdkConfigOverride  (minified: Z6, daemon.pretty.js:65853)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function applyJobSdkConfigOverride(config, override) {
    return !config || !override ? config : {
        ...config,
        prompt_mode: override.prompt_mode ?? config.prompt_mode,
        allowedTools: override.allowedTools ?? config.allowedTools,
        disallowedTools: override.disallowedTools ?? config.disallowedTools,
        additionalDirectories: override.additionalDirectories ?? config.additionalDirectories,
        claudeTools: mergeClaudeToolLists(config.claudeTools, override.claudeTools),
        claudeModelProfiles: overlayConfigEntriesByKey(config.claudeModelProfiles, override.claudeModelProfiles, profile => ({
            ...profile,
            source: "instance"
        })),
        claudeModelProfileIssues: wO(config.claudeModelProfileIssues, override.claudeModelProfileIssues),
        claudeModelAliases: Rve(config.claudeModelAliases, override.claudeModelAliases),
        claudeModelAliasIssues: wO(config.claudeModelAliasIssues, override.claudeModelAliasIssues),
        piExtensions: override.piExtensions ?? config.piExtensions,
        piSkills: override.piSkills ?? config.piSkills,
        piConfigIssues: appendPiConfigIssues(config.piConfigIssues, override.piConfigIssues)
    }
}
