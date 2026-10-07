// duoduo reconstruction — subsystem: 03-session-actor
// symbol: shutdownActorRuntimeAdapter  (minified: $N, daemon.pretty.js:83192)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function shutdownActorRuntimeAdapter(e) {
    let t = e.adapter;
    return t ? (e.adapter = null, e.adapterFacts = void 0, Promise.resolve(t.shutdown()).catch(n => {
        logWarnMessage("[session-manager] runtime adapter shutdown failed", {
            sessionKey: e.sessionKey,
            runtime: e.runtime,
            error: n instanceof Error ? n.message : String(n)
        })
    })) : Promise.resolve()
}
