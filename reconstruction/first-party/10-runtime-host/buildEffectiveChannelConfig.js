// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildEffectiveChannelConfig  (minified: Bwe, daemon.pretty.js:67185)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.5, v0.5.0, v0.5.10, v0.7.0, v0.8.0, v0.8.1, v0.8.4 (maps/history_daemon.json)
// locals: 8 renamed — 5 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildEffectiveChannelConfig(params) {
    let {
        channelKind,
        channelId,
        globalConfig,
        kindDescriptor,
        instanceDescriptor
    } = params, kindPrompt = kindDescriptor?.channel_prompt?.trim() || void 0, instancePrompt = instanceDescriptor?.channel_prompt?.trim() || void 0;
    return {
        channel_kind: instanceDescriptor?.channel_kind ?? kindDescriptor?.channel_kind ?? channelKind,
        channel_id: instanceDescriptor?.channel_id ?? channelId,
        display_name: instanceDescriptor?.display_name,
        new_session_workspace: instanceDescriptor?.new_session_workspace ?? kindDescriptor?.new_session_workspace,
        prompt_mode: instanceDescriptor?.prompt_mode ?? kindDescriptor?.prompt_mode ?? "append",
        time_gap_minutes: instanceDescriptor?.time_gap_minutes ?? kindDescriptor?.time_gap_minutes,
        auto_compact_idle_minutes: instanceDescriptor?.auto_compact_idle_minutes ?? kindDescriptor?.auto_compact_idle_minutes,
        auto_compact_min_context_tokens: instanceDescriptor?.auto_compact_min_context_tokens ?? kindDescriptor?.auto_compact_min_context_tokens,
        allowedTools: instanceDescriptor?.allowedTools ?? kindDescriptor?.allowedTools,
        disallowedTools: instanceDescriptor?.disallowedTools ?? kindDescriptor?.disallowedTools,
        claudeTools: mergeClaudeToolLists(kindDescriptor?.claudeTools, instanceDescriptor?.claudeTools),
        piExtensions: instanceDescriptor?.piExtensions ?? kindDescriptor?.piExtensions,
        piSkills: instanceDescriptor?.piSkills ?? kindDescriptor?.piSkills,
        piConfigIssues: appendPiConfigIssues(kindDescriptor?.piConfigIssues, instanceDescriptor?.piConfigIssues),
        additionalDirectories: instanceDescriptor?.additionalDirectories ?? kindDescriptor?.additionalDirectories,
        stream: instanceDescriptor?.stream ?? kindDescriptor?.stream,
        ...buildEffectiveRuntimeFields(instanceDescriptor, kindDescriptor),
        claudeModelProfiles: jwe([{
            source: "global",
            profiles: globalConfig?.claudeModelProfiles
        }, {
            source: "kind",
            profiles: kindDescriptor?.claudeModelProfiles
        }, {
            source: "instance",
            profiles: instanceDescriptor?.claudeModelProfiles
        }]),
        claudeModelProfileIssues: LO([{
            source: "global",
            issues: globalConfig?.claudeModelProfileIssues
        }, {
            source: "kind",
            issues: kindDescriptor?.claudeModelProfileIssues
        }, {
            source: "instance",
            issues: instanceDescriptor?.claudeModelProfileIssues
        }]),
        claudeModelAliases: Lwe([{
            source: "global",
            aliases: globalConfig?.claudeModelAliases
        }, {
            source: "kind",
            aliases: kindDescriptor?.claudeModelAliases
        }, {
            source: "instance",
            aliases: instanceDescriptor?.claudeModelAliases
        }]),
        claudeModelAliasIssues: LO([{
            source: "global",
            issues: globalConfig?.claudeModelAliasIssues
        }, {
            source: "kind",
            issues: kindDescriptor?.claudeModelAliasIssues
        }, {
            source: "instance",
            issues: instanceDescriptor?.claudeModelAliasIssues
        }]),
        runtimeModels: mergeRuntimeModelLayers([{
            source: "global",
            models: globalConfig?.runtimeModels
        }, {
            source: "kind",
            models: kindDescriptor?.runtimeModels
        }, {
            source: "instance",
            models: instanceDescriptor?.runtimeModels
        }]),
        runtimeEfforts: mergeRuntimeEffortLayers([{
            source: "global",
            efforts: globalConfig?.runtimeEfforts
        }, {
            source: "kind",
            efforts: kindDescriptor?.runtimeEfforts
        }, {
            source: "instance",
            efforts: instanceDescriptor?.runtimeEfforts
        }]),
        kind_prompt: kindPrompt,
        instance_prompt: instancePrompt,
        merged_prompt: $ft([kindPrompt, instancePrompt]),
        kind_config: kindDescriptor?.kind_config === void 0 && instanceDescriptor?.kind_config === void 0 ? void 0 : {
            ...kindDescriptor?.kind_config,
            ...instanceDescriptor?.kind_config
        }
    }
}
