// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEffectiveChannelConfig  (minified: ru, daemon.pretty.js:65973)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveEffectiveChannelConfig(e, t) {
    if (!t.channel_kind) return null;
    let n = t.channel_id && t.channel_id.trim().length > 0 ? await readChannelDescriptor(e, t.channel_id) : null,
        r = t.channel_kind.trim().toLowerCase();
    n && n.channel_kind.trim().toLowerCase() !== r && (logWarnMessage(`[channel-config] ignoring descriptor for ingress channel_id="${t.channel_id}" because descriptor kind "${n.channel_kind}" != ingress kind "${t.channel_kind}"`), n = null);
    let [i, o] = await Promise.all([loadGlobalRuntimeConfig(e.channelConfigDir), loadChannelKindConfig(e.channelConfigDir, t.channel_kind)]);
    return buildEffectiveChannelConfig({
        channelKind: t.channel_kind,
        channelId: t.channel_id,
        globalConfig: i,
        kindDescriptor: o,
        instanceDescriptor: n
    })
}
