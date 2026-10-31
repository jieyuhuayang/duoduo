// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEffectiveChannelConfigForEvent  (minified: x6, daemon.pretty.js:67308)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.10, v0.7.0 (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveEffectiveChannelConfigForEvent(paths, event) {
    let instanceDescriptor = await Bde(paths, event);
    if (event.source.kind === "route" && !instanceDescriptor && event.session_key) {
        let channelConfigBySession = await resolveChannelConfigBySession(paths, event.session_key);
        if (channelConfigBySession) return channelConfigBySession
    }
    let channelKind = Oft(event, instanceDescriptor);
    if (!channelKind) return null;
    let [globalConfig, kindDescriptor] = await Promise.all([loadGlobalRuntimeConfig(paths.channelConfigDir), loadChannelKindConfig(paths.channelConfigDir, channelKind)]);
    return buildEffectiveChannelConfig({
        channelKind,
        channelId: Aft(event, instanceDescriptor),
        globalConfig,
        kindDescriptor,
        instanceDescriptor
    })
}
