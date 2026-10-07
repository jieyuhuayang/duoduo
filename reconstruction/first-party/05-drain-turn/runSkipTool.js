// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runSkipTool  (minified: B$, daemon.pretty.js:54982)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.3, v0.4.0, v0.5.6 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSkipTool(e, t) {
    try {
        let {
            paths: n,
            bus: r,
            sessionKey: i
        } = t;
        if (!r) throw new Error("Skip is unavailable: runtime bus is not available in this context.");
        if (!i || i.trim().length === 0) throw new Error("Skip requires a current session context (session_key).");
        let o = e.reason?.trim();
        if (!o) throw new Error("reason is required and must not be empty.");
        return await patchSessionRuntimeState(n, i, {
            pending_skip_rewind: {
                reason: o,
                skipped_at: new Date().toISOString()
            }
        }), logInfoMessage("[Skip] skip rewind saved", {
            sessionKey: i,
            reason: o
        }), "Skipped. End your turn now — no further text, no further tool calls."
    } catch (n) {
        return logErrorMessage("[Skip] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
