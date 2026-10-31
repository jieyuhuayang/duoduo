// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeLegacyJobSessionKey  (minified: lgt, daemon.pretty.js:70534)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeLegacyJobSessionKey(params) {
    return WH({
        scope: "job",
        readableName: params.jobId,
        identityTuple: ["job", params.jobId.trim(), params.ownerSession?.trim() ?? "", params.cron?.trim() ?? "", params.cwdRel?.trim() ?? ""].join("|")
    })
}
