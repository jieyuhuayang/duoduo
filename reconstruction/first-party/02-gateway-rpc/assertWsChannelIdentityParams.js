// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: assertWsChannelIdentityParams  (minified: mIe, daemon.pretty.js:90486)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function assertWsChannelIdentityParams(e, t, n) {
    if (!n?.wsSubscriberId) return;
    let r = t.source_kind?.trim();
    if (!r) throw new JsonRpcInvalidParamsError(`${e} over WebSocket requires params.source_kind (adapter business kind, e.g. "acp")`);
    if (Fbt.has(r)) throw new JsonRpcInvalidParamsError(`${e} params.source_kind must be a business channel kind, not transport kind "${r}"`);
    let i = t.channel_id?.trim();
    if (!i) throw new JsonRpcInvalidParamsError(`${e} over WebSocket requires params.channel_id (stable business channel identity)`);
    try {
        assertValidChannelId(i)
    } catch (o) {
        let s = o instanceof Error ? o.message : String(o);
        throw new JsonRpcInvalidParamsError(s)
    }
}
