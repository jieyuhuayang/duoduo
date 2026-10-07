// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolvePendingModelFork  (minified: cht, daemon.pretty.js:72612)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.6 (high): `/model <id>` to switch the running session, `/model reset` to restore the daemon default. On Claude sessions the change takes effect on the next turn; on Codex sessions it is applied at the next thread fork.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolvePendingModelFork(e, t, n) {
    let r = async i => {
        let o = !1;
        try {
            await mutateSessionRuntimeState(e, t, s => s.model !== n.snapshotModel ? {} : (o = !0, {
                ...i,
                pending_model_fork: null
            }))
        } catch {
            return !1
        }
        return o
    };
    n.runtime === "codex" && !n.statelessJob ? (!n.sessionInfo.forkFrom && n.sessionInfo.sessionId ? await r({
        pending_fork_to: n.sessionInfo.sessionId
    }) && (n.sessionInfo.forkFrom = n.sessionInfo.sessionId) : await r(), logInfoMessage("[runner] resolved pending_model_fork at codex drain start", {
        sessionKey: t,
        forkFrom: n.sessionInfo.forkFrom ?? "(no fork this drain)",
        model: n.sessionInfo.model ?? "(runtime default)"
    })) : await r()
}
