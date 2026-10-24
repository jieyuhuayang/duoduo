// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: matchNearMissSessionKey  (minified: Wpt, daemon.pretty.js:67431)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 1 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind), yielding actionable suggestions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function matchNearMissSessionKey(target, entry) {
    if (entry.session_key === target) return null;
    let targetSegments = eSe(target),
        entrySegments = eSe(entry.session_key);
    if (targetSegments.length === 0 || entrySegments.length === 0) return null;
    if (targetSegments.length === entrySegments.length && targetSegments.length >= 2) {
        let i = 0;
        for (; i < targetSegments.length - 1 && targetSegments[i] === entrySegments[i];) i++;
        if (i === targetSegments.length - 1) {
            let targetLast = targetSegments[targetSegments.length - 1],
                entryLast = entrySegments[entrySegments.length - 1],
                boundedEditDistance = computeBoundedEditDistance(targetLast, entryLast, Qwe);
            if (boundedEditDistance <= Qwe) return {
                entry,
                note: `last segment differs by ${boundedEditDistance} char${boundedEditDistance===1?"":"s"}`
            };
            if (targetSegments[0] === "job" && targetSegments.length === 3) {
                let readableName = targetSegments[1];
                return {
                    entry,
                    note: `readable name "${readableName}" matches; hash differs — job may have been recreated`
                }
            }
        }
    }
    let targetTail = targetSegments[targetSegments.length - 1],
        entryTail = entrySegments[entrySegments.length - 1];
    return targetTail === entryTail && targetTail.length >= 6 && (targetSegments[0] !== entrySegments[0] || targetSegments.length !== entrySegments.length) ? {
        entry,
        note: `trailing identifier "${targetTail}" matches in a different scope`
    } : null
}
