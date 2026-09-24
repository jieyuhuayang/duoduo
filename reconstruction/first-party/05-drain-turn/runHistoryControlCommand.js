// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runHistoryControlCommand  (minified: xft, daemon.pretty.js:72119)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
