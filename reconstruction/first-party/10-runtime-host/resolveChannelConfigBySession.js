// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveChannelConfigBySession  (minified: iu, daemon.pretty.js:66018)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveChannelConfigBySession(e, t) {
    let r = (await readSessionRuntimeState(e, t).catch(o => (logWarnMessage("[channel-config] readSessionRuntimeState failed for by-session resolve", {
        sessionKey: t,
        error: o instanceof Error ? o.message : String(o)
    }), null)))?.source_channel_id;
    if (!r) return null;
    let i = await readChannelDescriptor(e, r).catch(o => (logWarnMessage("[channel-config] readChannelDescriptor failed for by-session resolve", {
        sessionKey: t,
        sourceChannelId: r,
        error: o instanceof Error ? o.message : String(o)
    }), null));
    return i?.channel_kind ? resolveEffectiveChannelConfig(e, {
        channel_kind: i.channel_kind,
        channel_id: r
    }).catch(o => (logWarnMessage("[channel-config] effective-config resolve failed for by-session resolve", {
        sessionKey: t,
        sourceChannelId: r,
        error: o instanceof Error ? o.message : String(o)
    }), null)) : null
}
