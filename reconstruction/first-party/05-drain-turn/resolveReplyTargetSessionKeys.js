// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveReplyTargetSessionKeys  (minified: Xxe, daemon.pretty.js:72443)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveReplyTargetSessionKeys(e, t, n) {
    let i = e.replySessionKey?.trim() || t.session_key || n,
        s = (isNonNullObject(t.payload) ? t.payload : void 0)?.reply_fanout_session_keys,
        a = Array.isArray(s) ? s.filter(l => typeof l == "string").map(l => l.trim()).filter(l => l.length > 0) : [],
        u = [i];
    for (let l of a) u.includes(l) || u.push(l);
    return {
        primaryTargetSessionKey: i,
        fanoutTargets: a,
        targetSessionKeys: u
    }
}
