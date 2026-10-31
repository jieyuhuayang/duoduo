// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEffectiveChannelConfig  (minified: au, daemon.pretty.js:67280)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.0 (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveEffectiveChannelConfig(paths, ingress) {
    if (!ingress.channel_kind) return null;
    let instanceDescriptor = ingress.channel_id && ingress.channel_id.trim().length > 0 ? await readChannelDescriptor(paths, ingress.channel_id) : null,
        ingressKind = ingress.channel_kind.trim().toLowerCase();
    instanceDescriptor && instanceDescriptor.channel_kind.trim().toLowerCase() !== ingressKind && (logWarnMessage(`[channel-config] ignoring descriptor for ingress channel_id="${ingress.channel_id}" because descriptor kind "${instanceDescriptor.channel_kind}" != ingress kind "${ingress.channel_kind}"`), instanceDescriptor = null);
    let [globalConfig, kindDescriptor] = await Promise.all([loadGlobalRuntimeConfig(paths.channelConfigDir), loadChannelKindConfig(paths.channelConfigDir, ingress.channel_kind)]);
    return buildEffectiveChannelConfig({
        channelKind: ingress.channel_kind,
        channelId: ingress.channel_id,
        globalConfig,
        kindDescriptor,
        instanceDescriptor
    })
}
