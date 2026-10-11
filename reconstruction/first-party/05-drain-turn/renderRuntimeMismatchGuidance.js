// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderRuntimeMismatchGuidance  (minified: mht, daemon.pretty.js:72668)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 4 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.3 (high): duoduo now refuses the switch with `runtime_mismatch`, naming both runtimes. `/clear`, then change the runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRuntimeMismatchGuidance(params) {
    let {
        boundRuntime,
        sdkSessionId,
        requestedRuntime,
        isChannel
    } = params, switchAction = isChannel ? `send /clear in this conversation, then send the message again; the new session runs on '${requestedRuntime}'` : `this job's owner decides whether the job starts a new session on '${requestedRuntime}'`;
    return [`This session is bound to runtime '${boundRuntime}' (sdk_session_id ${sdkSessionId}), but its configured runtime is now '${requestedRuntime}'. Request was not executed.`, "Session histories cannot move between runtimes, so choose one:", `- Keep this session: set the runtime back to '${boundRuntime}', then send the message again.`, `- Switch to '${requestedRuntime}' with a new session: ${switchAction}.`, `- If you switch, recover the prior work first: the old session's history is still on disk under id ${sdkSessionId} ('${boundRuntime}' runtime). Have a subagent locate that history and summarize it before starting the new session.`].join(`
`)
}
