// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: mergeGlobalModelConfigLayers  (minified: nu, daemon.pretty.js:65794)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeGlobalModelConfigLayers(e, t) {
    let n = Sve([{
            source: "global",
            profiles: e?.claudeModelProfiles
        }]),
        r = vO([{
            source: "global",
            issues: e?.claudeModelProfileIssues
        }]),
        i = kve([{
            source: "global",
            aliases: e?.claudeModelAliases
        }]),
        o = vO([{
            source: "global",
            issues: e?.claudeModelAliasIssues
        }]);
    return {
        claudeModelProfiles: overlayConfigEntriesByKey(n, t?.claudeModelProfiles, s => ({
            ...s,
            source: "instance"
        })),
        claudeModelProfileIssues: wO(r, t?.claudeModelProfileIssues),
        claudeModelAliases: Rve(i, t?.claudeModelAliases),
        claudeModelAliasIssues: wO(o, t?.claudeModelAliasIssues),
        runtimeModels: mergeRuntimeModelLayers([{
            source: "global",
            models: e?.runtimeModels
        }]),
        runtimeEfforts: mergeRuntimeEffortLayers([{
            source: "global",
            efforts: e?.runtimeEfforts
        }])
    }
}
