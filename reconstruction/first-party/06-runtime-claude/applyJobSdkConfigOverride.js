// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: applyJobSdkConfigOverride  (minified: KV, daemon.pretty.js:65582)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        claudeModelProfiles: GV(e.claudeModelProfiles, t.claudeModelProfiles, n => ({
            ...n,
            source: "instance"
        })),
        claudeModelProfileIssues: F$(e.claudeModelProfileIssues, t.claudeModelProfileIssues),
        claudeModelAliases: ube(e.claudeModelAliases, t.claudeModelAliases),
        claudeModelAliasIssues: F$(e.claudeModelAliasIssues, t.claudeModelAliasIssues),
        piExtensions: t.piExtensions ?? e.piExtensions,
        piSkills: t.piSkills ?? e.piSkills,
        piConfigIssues: lbe(e.piConfigIssues, t.piConfigIssues)
    }
}
