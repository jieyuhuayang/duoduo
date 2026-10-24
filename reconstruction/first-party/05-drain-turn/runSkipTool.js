// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runSkipTool  (minified: oC, daemon.pretty.js:57064)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.3, v0.4.0, v0.5.6 (maps/history_daemon.json)
// locals: 7 renamed — 4 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSkipTool(input, ctx) {
    try {
        let {
            paths,
            bus,
            sessionKey
        } = ctx;
        if (!bus) throw new Error("Skip is unavailable: runtime bus is not available in this context.");
        if (!sessionKey || sessionKey.trim().length === 0) throw new Error("Skip requires a current session context (session_key).");
        let reason = input.reason?.trim();
        if (!reason) throw new Error("reason is required and must not be empty.");
        return await patchSessionRuntimeState(paths, sessionKey, {
            pending_skip_rewind: {
                reason,
                skipped_at: new Date().toISOString()
            }
        }), logInfoMessage("[Skip] skip rewind saved", {
            sessionKey,
            reason
        }), "Skipped. End your turn now — no further text, no further tool calls."
    } catch (err) {
        return logErrorMessage("[Skip] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
