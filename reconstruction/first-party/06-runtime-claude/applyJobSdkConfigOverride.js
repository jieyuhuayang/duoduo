// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: applyJobSdkConfigOverride  (minified: RU, daemon.pretty.js:49967)
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
        claudeModelProfiles: EU(e.claudeModelProfiles, t.claudeModelProfiles, n => ({
            ...n,
            source: "instance"
        })),
        claudeModelProfileIssues: AT(e.claudeModelProfileIssues, t.claudeModelProfileIssues),
        claudeModelAliases: Wue(e.claudeModelAliases, t.claudeModelAliases),
        claudeModelAliasIssues: AT(e.claudeModelAliasIssues, t.claudeModelAliasIssues)
    }
}
