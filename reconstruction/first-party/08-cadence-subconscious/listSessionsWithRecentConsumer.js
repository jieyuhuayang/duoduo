// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSessionsWithRecentConsumer  (minified: Jdt, daemon.pretty.js:66068)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in v0.8.7 (maps/history_daemon.json)
// locals: 18 renamed — 2 from the code at the binding (rule), 16 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): now fails with a message naming the sessions that *do* have a reader
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionsWithRecentConsumer(paths, excludeSessionKey, finalSubscriberCount, now = Date.now(), unconsumedHours = resolveNotifyUnconsumedHours()) {
    let windowMs = unconsumedHours * vO,
        sessionIndexFromDisk = await buildSessionIndexFromDisk(paths),
        candidates = [];
    for (let session of sessionIndexFromDisk.listByKind("channel")) {
        if (session.session_key === excludeSessionKey) continue;
        let attached = finalSubscriberCount(session.session_key) > 0,
            latestDeliveryCursorUpdate = await readLatestDeliveryCursorUpdate(paths, session.session_key),
            cursorMs = latestDeliveryCursorUpdate === void 0 ? Number.NaN : Date.parse(latestDeliveryCursorUpdate),
            ageMs = Number.isFinite(cursorMs) ? Math.max(now - cursorMs, 0) : void 0,
            base = {
                session_key: session.session_key,
                display_name: session.display_name
            };
        attached ? candidates.push({
            ...base,
            attached: !0,
            ...ageMs !== void 0 ? {
                age_ms: ageMs
            } : {}
        }) : ageMs !== void 0 && ageMs <= windowMs && candidates.push({
            ...base,
            age_ms: ageMs
        })
    }
    let rank = candidate => candidate.attached ? -1 : candidate.age_ms ?? 1 / 0;
    return candidates.sort((left, right) => rank(left) - rank(right) || left.session_key.localeCompare(right.session_key))
}
