// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEffectiveChannelConfigForEvent  (minified: K6, daemon.pretty.js:66001)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveEffectiveChannelConfigForEvent(e, t) {
    let n = await Ece(e, t);
    if (t.source.kind === "route" && !n && t.session_key) {
        let s = await resolveChannelConfigBySession(e, t.session_key);
        if (s) return s
    }
    let r = hct(t, n);
    if (!r) return null;
    let [i, o] = await Promise.all([loadGlobalRuntimeConfig(e.channelConfigDir), loadChannelKindConfig(e.channelConfigDir, r)]);
    return buildEffectiveChannelConfig({
        channelKind: r,
        channelId: gct(t, n),
        globalConfig: i,
        kindDescriptor: o,
        instanceDescriptor: n
    })
}
