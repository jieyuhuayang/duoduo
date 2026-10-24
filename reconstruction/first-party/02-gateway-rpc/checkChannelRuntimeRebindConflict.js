// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: checkChannelRuntimeRebindConflict  (minified: wPe, daemon.pretty.js:93526)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.3 (high): **Changing a session's runtime needs `/clear` first.** A session is now bound to the runtime that created its history.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function checkChannelRuntimeRebindConflict(paths, sessionIndex, channelId, runtime) {
    let conflicts = [];
    for (let entry of sessionIndex.list()) {
        if (entry.source_channel_id !== channelId) continue;
        let runtimeState = await readSessionRuntimeState(paths, entry.session_key).catch(() => null);
        runtimeState?.sdk_session_id && runtimeState.sdk_session_runtime && runtimeState.sdk_session_runtime !== runtime && conflicts.push(`${entry.session_key} (bound to '${runtimeState.sdk_session_runtime}', sdk_session_id ${runtimeState.sdk_session_id})`)
    }
    return conflicts.length === 0 ? null : `runtime not changed to '${runtime}': ${conflicts.length} session(s) of channel ${channelId} hold history that only their current runtime can resume: ${conflicts.join("; ")}. Send /clear in each of those sessions first (recover anything worth keeping from its history before that), then set the runtime again.`
}
