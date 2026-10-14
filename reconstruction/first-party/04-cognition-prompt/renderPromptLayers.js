// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderPromptLayers  (minified: nye, daemon.pretty.js:55409)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 12 renamed — 2 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPromptLayers(channelConfig, sessionKey, job, board, runtime) {
    let metaPromptText = resolveMetaPromptText(),
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
        boardSection = yot.test(trimmed) ? `${Wge}

${trimmed}

${got}` : `${Wge}

${trimmed}`
    }
    let jobMission = job ? renderJobMissionBlock(job, job.stateless === !0) : void 0;
    return [metaPromptText, kindPrompt, instancePrompt, boardSection, runtimeContext, jobMission].filter(Boolean).join(`

`)
}
