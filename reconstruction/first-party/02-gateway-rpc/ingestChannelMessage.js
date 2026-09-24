// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ingestChannelMessage  (minified: Gle, daemon.pretty.js:87161)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ingestChannelMessage(e, t, n) {
    let r = parseInjectionPromptCommand(t.text),
        i = r ? void 0 : HR(t.text),
        o = t.routingHint?.intent ?? classifyGatewayCommandIntent(i),
        s = resolveRoutingTarget(t, i, r),
        a = s === "session" ? Zle(r, t.text) : void 0;
    return appendBeforeExecuteGateway(e, {
        eventType: "channel.message",
        sessionKey: t.sessionKey,
        sourceKind: t.sourceKind,
        sourceName: t.sourceName,
        sourceChannelId: t.sourceChannelId,
        dedupSourceId: t.dedupSourceId,
        text: a?.text ?? t.text,
        rawCommand: a?.rawCommand,
        attachments: t.attachments,
        replyFanoutSessionKeys: t.replyFanoutSessionKeys,
        rawPayload: t.rawPayload,
        routingHint: {
            target: t.routingHint?.target ?? s,
            intent: o,
            tags: t.routingHint?.tags
        }
    }, n)
}
