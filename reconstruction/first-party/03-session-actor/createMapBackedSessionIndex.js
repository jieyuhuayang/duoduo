// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMapBackedSessionIndex  (minified: tde, daemon.pretty.js:36885)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMapBackedSessionIndex(entriesByKey) {
    return {
        get(sessionKey) {
            return entriesByKey.get(sessionKey)
        },
        list() {
            return Array.from(entriesByKey.values())
        },
        listByKind(kind) {
            let result = [];
            for (let entry of entriesByKey.values()) classifySessionKeyKind(entry.session_key) === kind && result.push(entry);
            return result
        },
        listUserVisible() {
            let result = [];
            for (let entry of entriesByKey.values()) isUserVisibleSessionKey(entry.session_key) && result.push(entry);
            return result
        },
        upsert(entry) {
            let merged = {
                ...entriesByKey.get(entry.session_key),
                ...Tet(entry),
                session_key: entry.session_key
            };
            entriesByKey.set(entry.session_key, merged)
        },
        remove(sessionKey) {
            entriesByKey.delete(sessionKey)
        },
        size() {
            return entriesByKey.size
        }
    }
}
