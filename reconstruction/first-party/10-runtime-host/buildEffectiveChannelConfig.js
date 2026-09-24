// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildEffectiveChannelConfig  (minified: cbe, daemon.pretty.js:65607)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildEffectiveChannelConfig(e) {
    let {
        channelKind: t,
        channelId: n,
        globalConfig: r,
        kindDescriptor: i,
        instanceDescriptor: o
    } = e, s = i?.channel_prompt?.trim() || void 0, a = o?.channel_prompt?.trim() || void 0;
    return {
        channel_kind: o?.channel_kind ?? i?.channel_kind ?? t,
        channel_id: o?.channel_id ?? n,
        display_name: o?.display_name,
        new_session_workspace: o?.new_session_workspace ?? i?.new_session_workspace,
        prompt_mode: o?.prompt_mode ?? i?.prompt_mode ?? "append",
        time_gap_minutes: o?.time_gap_minutes ?? i?.time_gap_minutes,
        auto_compact_idle_minutes: o?.auto_compact_idle_minutes ?? i?.auto_compact_idle_minutes,
        auto_compact_min_context_tokens: o?.auto_compact_min_context_tokens ?? i?.auto_compact_min_context_tokens,
        allowedTools: o?.allowedTools ?? i?.allowedTools,
        disallowedTools: o?.disallowedTools ?? i?.disallowedTools,
        claudeTools: mergeClaudeToolLists(i?.claudeTools, o?.claudeTools),
        piExtensions: o?.piExtensions ?? i?.piExtensions,
        piSkills: o?.piSkills ?? i?.piSkills,
        piConfigIssues: appendPiConfigIssues(i?.piConfigIssues, o?.piConfigIssues),
        additionalDirectories: o?.additionalDirectories ?? i?.additionalDirectories,
        stream: o?.stream ?? i?.stream,
        runtime: o?.runtime ?? i?.runtime,
        claudeModelProfiles: ibe([{
            source: "global",
            profiles: r?.claudeModelProfiles
        }, {
            source: "kind",
            profiles: i?.claudeModelProfiles
        }, {
            source: "instance",
            profiles: o?.claudeModelProfiles
        }]),
        claudeModelProfileIssues: L$([{
            source: "global",
            issues: r?.claudeModelProfileIssues
        }, {
            source: "kind",
            issues: i?.claudeModelProfileIssues
        }, {
            source: "instance",
            issues: o?.claudeModelProfileIssues
        }]),
        claudeModelAliases: obe([{
            source: "global",
            aliases: r?.claudeModelAliases
        }, {
            source: "kind",
            aliases: i?.claudeModelAliases
        }, {
            source: "instance",
            aliases: o?.claudeModelAliases
        }]),
        claudeModelAliasIssues: L$([{
            source: "global",
            issues: r?.claudeModelAliasIssues
        }, {
            source: "kind",
            issues: i?.claudeModelAliasIssues
        }, {
            source: "instance",
            issues: o?.claudeModelAliasIssues
        }]),
        runtimeModels: mergeRuntimeModelLayers([{
            source: "global",
            models: r?.runtimeModels
        }, {
            source: "kind",
            models: i?.runtimeModels
        }, {
            source: "instance",
            models: o?.runtimeModels
        }]),
        runtimeEfforts: mergeRuntimeEffortLayers([{
            source: "global",
            efforts: r?.runtimeEfforts
        }, {
            source: "kind",
            efforts: i?.runtimeEfforts
        }, {
            source: "instance",
            efforts: o?.runtimeEfforts
        }]),
        kind_prompt: s,
        instance_prompt: a,
        merged_prompt: _ut([s, a]),
        kind_config: i?.kind_config === void 0 && o?.kind_config === void 0 ? void 0 : {
            ...i?.kind_config,
            ...o?.kind_config
        }
    }
}
