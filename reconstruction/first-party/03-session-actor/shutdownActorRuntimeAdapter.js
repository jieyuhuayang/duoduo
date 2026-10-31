// duoduo reconstruction — subsystem: 03-session-actor
// symbol: shutdownActorRuntimeAdapter  (minified: KN, daemon.pretty.js:84491)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function shutdownActorRuntimeAdapter(actor) {
    let adapter = actor.adapter;
    return adapter ? (actor.adapter = null, actor.adapterFacts = void 0, Promise.resolve(adapter.shutdown()).catch(err => {
        logWarnMessage("[session-manager] runtime adapter shutdown failed", {
            sessionKey: actor.sessionKey,
            runtime: actor.runtime,
            error: err instanceof Error ? err.message : String(err)
        })
    })) : Promise.resolve()
}
