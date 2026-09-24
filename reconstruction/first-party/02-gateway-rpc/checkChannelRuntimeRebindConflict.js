// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: checkChannelRuntimeRebindConflict  (minified: N0e, daemon.pretty.js:89870)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function checkChannelRuntimeRebindConflict(e, t, n, r) {
    let i = [];
    for (let o of t.list()) {
        if (o.source_channel_id !== n) continue;
        let s = await ct(e, o.session_key).catch(() => null);
        s?.sdk_session_id && s.sdk_session_runtime && s.sdk_session_runtime !== r && i.push(`${o.session_key} (bound to '${s.sdk_session_runtime}', sdk_session_id ${s.sdk_session_id})`)
    }
    return i.length === 0 ? null : `runtime not changed to '${r}': ${i.length} session(s) of channel ${n} hold history that only their current runtime can resume: ${i.join("; ")}. Send /clear in each of those sessions first (recover anything worth keeping from its history before that), then set the runtime again.`
}
