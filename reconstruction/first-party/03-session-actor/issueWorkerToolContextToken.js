// duoduo reconstruction — subsystem: 03-session-actor
// symbol: issueWorkerToolContextToken  (minified: oC, daemon.pretty.js:55858)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function issueWorkerToolContextToken(e) {
    let t = xot(32).toString("hex"),
        n = nye.get(e.session_key);
    return n && vV.delete(n), nye.set(e.session_key, t), vV.set(t, {
        ...e
    }), t
}
