// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolvePendingModelFork  (minified: fht, daemon.pretty.js:72613)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (high): `/model <id>` to switch the running session, `/model reset` to restore the daemon default. On Claude sessions the change takes effect on the next turn; on Codex sessions it is applied at the next thread fork.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolvePendingModelFork(paths, sessionKey, params) {
    let commitFork = async patch => {
        let applied = !1;
        try {
            await mutateSessionRuntimeState(paths, sessionKey, state => state.model !== params.snapshotModel ? {} : (applied = !0, {
                ...patch,
                pending_model_fork: null
            }))
        } catch {
            return !1
        }
        return applied
    };
    params.runtime === "codex" && !params.statelessJob ? (!params.sessionInfo.forkFrom && params.sessionInfo.sessionId ? await commitFork({
        pending_fork_to: params.sessionInfo.sessionId
    }) && (params.sessionInfo.forkFrom = params.sessionInfo.sessionId) : await commitFork(), logInfoMessage("[runner] resolved pending_model_fork at codex drain start", {
        sessionKey,
        forkFrom: params.sessionInfo.forkFrom ?? "(no fork this drain)",
        model: params.sessionInfo.model ?? "(runtime default)"
    })) : await commitFork()
}
