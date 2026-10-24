// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: listSessionsWithRecentConsumer  (minified: Tpt, daemon.pretty.js:66876)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 12 renamed — 2 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): now fails with a message naming the sessions that *do* have a reader
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listSessionsWithRecentConsumer(paths, excludeSessionKey, now = Date.now(), unconsumedHours = resolveNotifyUnconsumedHours()) {
    let maxAgeMs = unconsumedHours * _O,
        sessionIndexFromDisk = await buildSessionIndexFromDisk(paths),
        candidates = [];
    for (let session of sessionIndexFromDisk.listByKind("channel")) {
        if (session.session_key === excludeSessionKey) continue;
        let latestDeliveryCursorUpdate = await readLatestDeliveryCursorUpdate(paths, session.session_key);
        if (latestDeliveryCursorUpdate === void 0) continue;
        let cursorUpdatedMs = Date.parse(latestDeliveryCursorUpdate);
        if (!Number.isFinite(cursorUpdatedMs)) continue;
        let ageMs = Math.max(now - cursorUpdatedMs, 0);
        ageMs > maxAgeMs || candidates.push({
            session_key: session.session_key,
            display_name: session.display_name,
            age_ms: ageMs
        })
    }
    return candidates.sort((a, b) => a.age_ms - b.age_ms || a.session_key.localeCompare(b.session_key))
}
