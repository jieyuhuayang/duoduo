// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderRuntimeMismatchGuidance  (minified: $ft, daemon.pretty.js:72366)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderRuntimeMismatchGuidance(e) {
    let {
        boundRuntime: t,
        sdkSessionId: n,
        requestedRuntime: r,
        isChannel: i
    } = e, o = i ? `send /clear in this conversation, then send the message again; the new session runs on '${r}'` : `this job's owner decides whether the job starts a new session on '${r}'`;
    return [`This session is bound to runtime '${t}' (sdk_session_id ${n}), but its configured runtime is now '${r}'. Request was not executed.`, "Session histories cannot move between runtimes, so choose one:", `- Keep this session: set the runtime back to '${t}', then send the message again.`, `- Switch to '${r}' with a new session: ${o}.`, `- If you switch, recover the prior work first: the old session's history is still on disk under id ${n} ('${t}' runtime). Have a subagent locate that history and summarize it before starting the new session.`].join(`
`)
}
