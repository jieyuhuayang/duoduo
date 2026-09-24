// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEffectiveChannelConfigForEvent  (minified: YV, daemon.pretty.js:65730)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveEffectiveChannelConfigForEvent(e, t) {
    let n = await lle(e, t);
    if (t.source.kind === "route" && !n && t.session_key) {
        let s = await Ga(e, t.session_key);
        if (s) return s
    }
    let r = vut(t, n);
    if (!r) return null;
    let [i, o] = await Promise.all([si(e.channelConfigDir), loadChannelKindConfig(e.channelConfigDir, r)]);
    return buildEffectiveChannelConfig({
        channelKind: r,
        channelId: wut(t, n),
        globalConfig: i,
        kindDescriptor: o,
        instanceDescriptor: n
    })
}
