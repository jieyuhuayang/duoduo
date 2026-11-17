// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadChannelKindConfig  (minified: Xa, daemon.pretty.js:38131)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadChannelKindConfig(channelConfigDir, channelKind) {
    let normalizedKind = channelKind.trim().toLowerCase();
    if (!crt(normalizedKind)) return logWarnMessage(`[channel-config] invalid channel kind "${channelKind}"`), null;
    let filePath = kfe.join(channelConfigDir, `${normalizedKind}.md`),
        readResult = await Efe(filePath);
    if (readResult.status !== "ok") return null;
    let channelConfigFields = parseChannelConfigFields(readResult.data);
    FI(filePath, channelConfigFields.claudeModelProfileIssues), FI(filePath, channelConfigFields.claudeModelAliasIssues, "claude.model_aliases");
    let channelPrompt = drt(readResult.body);
    return {
        channel_kind: normalizedKind,
        ...channelConfigFields,
        channel_prompt: channelPrompt,
        kind_config: OI(readResult.data, normalizedKind, filePath)
    }
}
