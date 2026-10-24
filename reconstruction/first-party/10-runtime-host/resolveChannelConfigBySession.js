// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveChannelConfigBySession  (minified: su, daemon.pretty.js:68101)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (medium): A channel session that has sat idle past a configurable threshold and grown past a token floor now silently runs `/compact` on its next turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveChannelConfigBySession(paths, sessionKey) {
    let sourceChannelId = (await readSessionRuntimeState(paths, sessionKey).catch(stateErr => (logWarnMessage("[channel-config] readSessionRuntimeState failed for by-session resolve", {
        sessionKey,
        error: stateErr instanceof Error ? stateErr.message : String(stateErr)
    }), null)))?.source_channel_id;
    if (!sourceChannelId) return null;
    let descriptor = await readChannelDescriptor(paths, sourceChannelId).catch(descriptorErr => (logWarnMessage("[channel-config] readChannelDescriptor failed for by-session resolve", {
        sessionKey,
        sourceChannelId,
        error: descriptorErr instanceof Error ? descriptorErr.message : String(descriptorErr)
    }), null));
    return descriptor?.channel_kind ? resolveEffectiveChannelConfig(paths, {
        channel_kind: descriptor.channel_kind,
        channel_id: sourceChannelId
    }).catch(resolveErr => (logWarnMessage("[channel-config] effective-config resolve failed for by-session resolve", {
        sessionKey,
        sourceChannelId,
        error: resolveErr instanceof Error ? resolveErr.message : String(resolveErr)
    }), null)) : null
}
