// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeGlobalModelConfigLayers  (minified: nu, daemon.pretty.js:65794)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeGlobalModelConfigLayers(globalConfig, instanceConfig) {
    let globalProfiles = Sve([{
            source: "global",
            profiles: globalConfig?.claudeModelProfiles
        }]),
        globalProfileIssues = vO([{
            source: "global",
            issues: globalConfig?.claudeModelProfileIssues
        }]),
        globalAliases = kve([{
            source: "global",
            aliases: globalConfig?.claudeModelAliases
        }]),
        globalAliasIssues = vO([{
            source: "global",
            issues: globalConfig?.claudeModelAliasIssues
        }]);
    return {
        claudeModelProfiles: overlayConfigEntriesByKey(globalProfiles, instanceConfig?.claudeModelProfiles, profile => ({
            ...profile,
            source: "instance"
        })),
        claudeModelProfileIssues: wO(globalProfileIssues, instanceConfig?.claudeModelProfileIssues),
        claudeModelAliases: Rve(globalAliases, instanceConfig?.claudeModelAliases),
        claudeModelAliasIssues: wO(globalAliasIssues, instanceConfig?.claudeModelAliasIssues),
        runtimeModels: mergeRuntimeModelLayers([{
            source: "global",
            models: globalConfig?.runtimeModels
        }]),
        runtimeEfforts: mergeRuntimeEffortLayers([{
            source: "global",
            efforts: globalConfig?.runtimeEfforts
        }])
    }
}
