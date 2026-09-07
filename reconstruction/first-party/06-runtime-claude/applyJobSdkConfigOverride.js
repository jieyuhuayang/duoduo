// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: applyJobSdkConfigOverride  (minified: $2, daemon.pretty.js:59028)
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
        claudeModelProfiles: O2(e.claudeModelProfiles, t.claudeModelProfiles, n => ({
            ...n,
            source: "instance"
        })),
        claudeModelProfileIssues: dP(e.claudeModelProfileIssues, t.claudeModelProfileIssues),
        claudeModelAliases: Xpe(e.claudeModelAliases, t.claudeModelAliases),
        claudeModelAliasIssues: dP(e.claudeModelAliasIssues, t.claudeModelAliasIssues),
        piExtensions: t.piExtensions ?? e.piExtensions,
        piSkills: t.piSkills ?? e.piSkills,
        piConfigIssues: Qpe(e.piConfigIssues, t.piConfigIssues)
    }
}
