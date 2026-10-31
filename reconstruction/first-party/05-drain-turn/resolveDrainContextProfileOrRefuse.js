// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveDrainContextProfileOrRefuse  (minified: HEe, daemon.pretty.js:71842)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveDrainContextProfileOrRefuse(paths, sessionKey, profileOptions, ctx) {
    try {
        return await prepareClaudeContextProfile(paths, profileOptions)
    } catch (err) {
        let message = err instanceof Error ? err.message : String(err);
        throw await handleDrainError(paths, sessionKey, {
            anchor: ctx.anchor,
            error: err,
            stage: "context_profile",
            userText: `[duoduo:drain-error] agent turn refused before it started: this session's model context profile could not be resolved.

${message}

Fix the offending claude.model_profiles entry — the layer named above says which file: global = kernel/config/runtime.md, kind = kernel/config/<kind>.md, instance = the channel descriptor or the job file. No prompt reached the model and no pending notification was consumed, so the next turn runs normally once the config parses.`,
            precedingRecords: ctx.precedingRecords,
            bus: ctx.bus
        }), err
    }
}
