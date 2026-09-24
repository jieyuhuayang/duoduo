// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMapBackedSessionIndex  (minified: h_e, daemon.pretty.js:64118)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
                ...Eat(t),
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
