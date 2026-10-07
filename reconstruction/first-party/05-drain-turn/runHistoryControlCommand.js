// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runHistoryControlCommand  (minified: aht, daemon.pretty.js:72421)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.5.2 (high): `/compact` and `/undo` work everywhere. … Both runtimes shrink the conversation in place or roll back the last `N` exchanges, with a text reply when the command finishes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runHistoryControlCommand(e) {
    let {
        sdk: t,
        sessionInfo: n,
        cmdToken: r
    } = e, i = n.sessionId;
    if (r === "/compact") {
        if (!i) return "ℹ️ Nothing to compact — no active session.";
        if (!t.compact) return "✗ Compact failed: adapter does not implement compact().";
        let o = await t.compact({
            sessionId: i,
            cwd: n.cwd
        });
        if (o.kind === "succeeded") {
            let s = typeof o.pre_input_tokens == "number" ? ` (pre_input_tokens: ${o.pre_input_tokens})` : "";
            return `📦 History compacted (runtime: ${o.runtime})${s}.`
        }
        return o.kind === "noop" ? `ℹ️ Nothing to compact: ${o.reason}.` : `✗ Compact failed: ${o.error}.`
    }
    return `✗ Unrecognized history-control command: ${r}.`
}
