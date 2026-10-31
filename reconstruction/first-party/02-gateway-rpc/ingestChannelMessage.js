// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ingestChannelMessage  (minified: Nfe, daemon.pretty.js:88841)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.5.7 (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ingestChannelMessage(paths, message, options) {
    let injectionPromptCommand = parseInjectionPromptCommand(message.text),
        gatewayCommand = injectionPromptCommand ? void 0 : parseGatewayCommandText(message.text),
        intent = message.routingHint?.intent ?? classifyGatewayCommandIntent(gatewayCommand),
        routingTarget = resolveRoutingTarget(message, gatewayCommand, injectionPromptCommand),
        expanded = routingTarget === "session" ? expandInjectionPromptCommand(injectionPromptCommand, message.text) : void 0;
    return appendBeforeExecuteGateway(paths, {
        eventType: "channel.message",
        sessionKey: message.sessionKey,
        sourceKind: message.sourceKind,
        sourceName: message.sourceName,
        sourceChannelId: message.sourceChannelId,
        dedupSourceId: message.dedupSourceId,
        text: expanded?.text ?? message.text,
        rawCommand: expanded?.rawCommand,
        attachments: message.attachments,
        replyFanoutSessionKeys: message.replyFanoutSessionKeys,
        rawPayload: message.rawPayload,
        routingHint: {
            target: message.routingHint?.target ?? routingTarget,
            intent,
            tags: message.routingHint?.tags
        }
    }, options)
}
