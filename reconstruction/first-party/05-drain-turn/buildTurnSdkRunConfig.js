// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: buildTurnSdkRunConfig  (minified: qxe, daemon.pretty.js:70628)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.10, v0.8.0 (maps/history_daemon.json)
// locals: 12 renamed — 0 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTurnSdkRunConfig(options, channelConfig) {
    let pickToolList = (base, override) => override !== void 0 ? Tmt(base, override) : zxe(base),
        allowedTools = pickToolList(options.allowedTools, channelConfig?.allowedTools),
        disallowedTools = pickToolList(options.disallowedTools, channelConfig?.disallowedTools),
        allowedSet = new Set(allowedTools ?? []),
        filteredDisallowed = disallowedTools?.filter(tool => !allowedSet.has(tool)),
        tools = pickToolList(options.tools, channelConfig?.claudeTools),
        additionalDirectories = pickToolList(options.additionalDirectories, channelConfig?.additionalDirectories);
    return {
        allowedTools,
        disallowedTools: filteredDisallowed,
        tools,
        additionalDirectories,
        permissionMode: options.permissionMode
    }
}
