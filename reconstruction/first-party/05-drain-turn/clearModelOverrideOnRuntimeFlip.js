// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: clearModelOverrideOnRuntimeFlip  (minified: Pyt, daemon.pretty.js:73818)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 3 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): `/model <id>` to switch the running session, `/model reset` to restore the daemon default. On Claude sessions the change takes effect on the next turn; on Codex sessions it is applied at the next thread fork.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearModelOverrideOnRuntimeFlip(paths, sessionKey, params) {
    let {
        snapshotModel,
        snapshotModelRuntime,
        activeRuntime
    } = params;
    !params.sessionInfo.model || !(snapshotModelRuntime ? snapshotModelRuntime !== activeRuntime : activeRuntime === "codex" || activeRuntime === "pi") || (params.sessionInfo.model = void 0, await mutateSessionRuntimeState(paths, sessionKey, state => state.model !== snapshotModel || state.model_runtime !== snapshotModelRuntime ? {} : {
        model: null,
        model_runtime: null,
        pending_model_fork: null
    }).catch(() => {}), logInfoMessage(snapshotModelRuntime ? "[runner] cleared session model override on runtime flip" : "[runner] cleared un-stamped legacy model override on incompatible runtime drain", {
        sessionKey,
        overrideRuntime: snapshotModelRuntime,
        activeRuntime,
        droppedModel: snapshotModel
    }))
}
