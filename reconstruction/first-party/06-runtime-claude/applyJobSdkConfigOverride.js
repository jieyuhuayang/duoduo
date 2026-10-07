// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: applyJobSdkConfigOverride  (minified: Z6, daemon.pretty.js:65853)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.6.2 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function applyJobSdkConfigOverride(e, t) {
    return !e || !t ? e : {
        ...e,
        prompt_mode: t.prompt_mode ?? e.prompt_mode,
        allowedTools: t.allowedTools ?? e.allowedTools,
        disallowedTools: t.disallowedTools ?? e.disallowedTools,
        additionalDirectories: t.additionalDirectories ?? e.additionalDirectories,
        claudeTools: mergeClaudeToolLists(e.claudeTools, t.claudeTools),
        claudeModelProfiles: overlayConfigEntriesByKey(e.claudeModelProfiles, t.claudeModelProfiles, n => ({
            ...n,
            source: "instance"
        })),
        claudeModelProfileIssues: wO(e.claudeModelProfileIssues, t.claudeModelProfileIssues),
        claudeModelAliases: Rve(e.claudeModelAliases, t.claudeModelAliases),
        claudeModelAliasIssues: wO(e.claudeModelAliasIssues, t.claudeModelAliasIssues),
        piExtensions: t.piExtensions ?? e.piExtensions,
        piSkills: t.piSkills ?? e.piSkills,
        piConfigIssues: appendPiConfigIssues(e.piConfigIssues, t.piConfigIssues)
    }
}
