// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMapBackedSessionIndex  (minified: ede, daemon.pretty.js:36885)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMapBackedSessionIndex(e) {
    return {
        get(t) {
            return e.get(t)
        },
        list() {
            return Array.from(e.values())
        },
        listByKind(t) {
            let n = [];
            for (let r of e.values()) classifySessionKeyKind(r.session_key) === t && n.push(r);
            return n
        },
        listUserVisible() {
            let t = [];
            for (let n of e.values()) isUserVisibleSessionKey(n.session_key) && t.push(n);
            return t
        },
        upsert(t) {
            let r = {
                ...e.get(t.session_key),
                ...Eet(t),
                session_key: t.session_key
            };
            e.set(t.session_key, r)
        },
        remove(t) {
            e.delete(t)
        },
        size() {
            return e.size
        }
    }
}
