// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runHistoryControlCommand  (minified: obt, daemon.pretty.js:74504)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 4 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (high): `/compact` and `/undo` work everywhere. … Both runtimes shrink the conversation in place or roll back the last `N` exchanges, with a text reply when the command finishes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runHistoryControlCommand(params) {
    let {
        sdk,
        sessionInfo,
        cmdToken
    } = params, sessionId = sessionInfo.sessionId;
    if (cmdToken === "/compact") {
        if (!sessionId) return "ℹ️ Nothing to compact — no active session.";
        if (!sdk.compact) return "✗ Compact failed: adapter does not implement compact().";
        let result = await sdk.compact({
            sessionId,
            cwd: sessionInfo.cwd
        });
        if (result.kind === "succeeded") {
            let preTokensSuffix = typeof result.pre_input_tokens == "number" ? ` (pre_input_tokens: ${result.pre_input_tokens})` : "";
            return `📦 History compacted (runtime: ${result.runtime})${preTokensSuffix}.`
        }
        return result.kind === "noop" ? `ℹ️ Nothing to compact: ${result.reason}.` : `✗ Compact failed: ${result.error}.`
    }
    return `✗ Unrecognized history-control command: ${cmdToken}.`
}
