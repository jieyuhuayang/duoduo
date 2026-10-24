// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: assertWsChannelIdentityParams  (minified: lPe, daemon.pretty.js:92614)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertWsChannelIdentityParams(method, params, context) {
    if (!context?.wsSubscriberId) return;
    let sourceKind = params.source_kind?.trim();
    if (!sourceKind) throw new JsonRpcInvalidParamsError(`${method} over WebSocket requires params.source_kind (adapter business kind, e.g. "acp")`);
    if (Fkt.has(sourceKind)) throw new JsonRpcInvalidParamsError(`${method} params.source_kind must be a business channel kind, not transport kind "${sourceKind}"`);
    let channelId = params.channel_id?.trim();
    if (!channelId) throw new JsonRpcInvalidParamsError(`${method} over WebSocket requires params.channel_id (stable business channel identity)`);
    try {
        assertValidChannelId(channelId)
    } catch (err) {
        let message = err instanceof Error ? err.message : String(err);
        throw new JsonRpcInvalidParamsError(message)
    }
}
