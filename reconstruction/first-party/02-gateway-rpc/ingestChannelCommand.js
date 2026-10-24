// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ingestChannelCommand  (minified: hv, daemon.pretty.js:89668)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.5.7, v0.5.10 (maps/history_daemon.json)
// locals: 10 renamed — 1 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ingestChannelCommand(paths, request, options) {
    let injectionPromptCommand = parseInjectionPromptCommand(request.command),
        gatewayCommand = injectionPromptCommand ? void 0 : parseGatewayCommandText(request.command),
        intent = request.routingHint?.intent ?? classifyGatewayCommandIntent(gatewayCommand),
        hasInjectionArgs = !!injectionPromptCommand?.args,
        defaultTarget = intent === "history-control" || hasInjectionArgs ? "session" : "gateway",
        target = request.routingHint?.target ?? defaultTarget,
        expanded = target === "session" ? expandInjectionPromptCommand(injectionPromptCommand, request.command) : void 0;
    return appendBeforeExecuteGateway(paths, {
        eventType: "channel.command",
        sessionKey: request.sessionKey,
        sourceKind: request.sourceKind,
        sourceName: request.sourceName,
        sourceChannelId: request.sourceChannelId,
        dedupSourceId: request.dedupSourceId,
        text: expanded?.text ?? request.command,
        command: request.command,
        rawCommand: expanded?.rawCommand,
        rawPayload: request.rawPayload,
        idle_ms: request.idle_ms,
        threshold_at_fire: request.threshold_at_fire,
        routingHint: {
            target,
            intent,
            tags: request.routingHint?.tags
        }
    }, options)
}
