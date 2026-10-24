// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: materializeClaudeSettingsFile  (minified: fSe, daemon.pretty.js:67751)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function materializeClaudeSettingsFile(params) {
    let claudeSettingsEnvOverrides = buildClaudeSettingsEnvOverrides(params);
    if (!claudeSettingsEnvOverrides) return;
    imt();
    let settingsJson = nmt(claudeSettingsEnvOverrides),
        settingsPath = cSe.join(params.dir, rmt(settingsJson));
    return T6.has(settingsPath) || (await writeFileAtomic(settingsPath, settingsJson, {
        mode: 384
    }), await I6.chmod(settingsPath, 384), T6.add(settingsPath)), settingsPath
}
