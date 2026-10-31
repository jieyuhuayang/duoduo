// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderPromptLayers  (minified: __e, daemon.pretty.js:56679)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.7 (maps/history_daemon.json)
// locals: 13 renamed — 1 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPromptLayers(channelConfig, sessionKey, jobMission, board, runtime, rolePrompt) {
    let identityLayer = composeIdentityLayer(resolveMetaPromptText(), rolePrompt),
        kindPrompt = channelConfig?.kind_prompt?.trim() || void 0,
        instancePrompt = channelConfig?.instance_prompt?.trim() || void 0,
        runtimeContext = sessionKey ? `## Runtime Context

The channel through which this session receives and delivers messages, and the runtime executing it.
- session_key: ${sessionKey}
- channel_kind: ${channelConfig?.channel_kind??"unknown"}${runtime?`
- runtime: ${runtime}`:""}` : void 0,
        boardSection;
    if (board && board.content.trim().length > 0) {
        let trimmed = board.content.trim();
        boardSection = Oat.test(trimmed) ? `${l_e}

${trimmed}

${Cat}` : `${l_e}

${trimmed}`
    }
    let jobMission2 = jobMission ? renderJobMissionBlock(jobMission, jobMission.stateless === !0) : void 0;
    return [identityLayer, kindPrompt, instancePrompt, boardSection, runtimeContext, jobMission2].filter(Boolean).join(`

`)
}
