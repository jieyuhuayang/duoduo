// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveReplyTargetSessionKeys  (minified: Xxe, daemon.pretty.js:72443)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 0 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveReplyTargetSessionKeys(item, event, fallbackSessionKey) {
    let primaryTarget = item.replySessionKey?.trim() || event.session_key || fallbackSessionKey,
        rawFanout = (isNonNullObject(event.payload) ? event.payload : void 0)?.reply_fanout_session_keys,
        fanoutKeys = Array.isArray(rawFanout) ? rawFanout.filter(key => typeof key == "string").map(key => key.trim()).filter(key => key.length > 0) : [],
        targetKeys = [primaryTarget];
    for (let key of fanoutKeys) targetKeys.includes(key) || targetKeys.push(key);
    return {
        primaryTargetSessionKey: primaryTarget,
        fanoutTargets: fanoutKeys,
        targetSessionKeys: targetKeys
    }
}
