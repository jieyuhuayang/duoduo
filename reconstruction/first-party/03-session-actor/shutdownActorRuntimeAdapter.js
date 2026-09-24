// duoduo reconstruction — subsystem: 03-session-actor
// symbol: shutdownActorRuntimeAdapter  (minified: LA, daemon.pretty.js:82892)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function shutdownActorRuntimeAdapter(e) {
    let t = e.adapter;
    return t ? (e.adapter = null, e.adapterFacts = void 0, Promise.resolve(t.shutdown()).catch(n => {
        Z("[session-manager] runtime adapter shutdown failed", {
            sessionKey: e.sessionKey,
            runtime: e.runtime,
            error: n instanceof Error ? n.message : String(n)
        })
    })) : Promise.resolve()
}
