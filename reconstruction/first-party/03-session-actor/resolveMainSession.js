// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveMainSession  (minified: Mb, daemon.pretty.js:32693)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.6 main-session.ts (maps/published_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMainSession(e) {
    let t = new Set;
    for (let r of e) isMainSessionCandidate(r) && t.add(r.session_key);
    let n = [...t].sort();
    return n.length === 0 ? {
        state: "absent"
    } : n.length === 1 ? {
        state: "held",
        session_key: n[0]
    } : {
        state: "ambiguous",
        candidates: n
    }
}
