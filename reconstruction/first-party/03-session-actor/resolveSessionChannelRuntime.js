// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionChannelRuntime  (minified: vh, daemon.pretty.js:39026)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveSessionChannelRuntime(paths, sessionKey, sourceChannelId) {
    let channelId = sourceChannelId ?? (await readSessionRuntimeState(paths, sessionKey).catch(() => null))?.source_channel_id;
    if (!channelId) return resolveLayeredChannelRuntime(null, null);
    let channelDescriptor = await readChannelDescriptor(paths, channelId).catch(() => null),
        channelKind = channelDescriptor?.channel_kind,
        kindConfig = channelKind ? await loadChannelKindConfig(paths.channelConfigDir, channelKind).catch(() => null) : null;
    return resolveLayeredChannelRuntime(channelDescriptor, kindConfig)
}
