// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ingestChannelCommand  (minified: $b, daemon.pretty.js:87186)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ingestChannelCommand(e, t, n) {
    let r = parseInjectionPromptCommand(t.command),
        i = r ? void 0 : HR(t.command),
        o = t.routingHint?.intent ?? classifyGatewayCommandIntent(i),
        s = !!r?.args,
        a = o === "history-control" || s ? "session" : "gateway",
        u = t.routingHint?.target ?? a,
        l = u === "session" ? Zle(r, t.command) : void 0;
    return appendBeforeExecuteGateway(e, {
        eventType: "channel.command",
        sessionKey: t.sessionKey,
        sourceKind: t.sourceKind,
        sourceName: t.sourceName,
        sourceChannelId: t.sourceChannelId,
        dedupSourceId: t.dedupSourceId,
        text: l?.text ?? t.command,
        command: t.command,
        rawCommand: l?.rawCommand,
        rawPayload: t.rawPayload,
        idle_ms: t.idle_ms,
        threshold_at_fire: t.threshold_at_fire,
        routingHint: {
            target: u,
            intent: o,
            tags: t.routingHint?.tags
        }
    }, n)
}
