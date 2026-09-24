// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeLegacyJobSessionKey  (minified: sdt, daemon.pretty.js:69044)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeLegacyJobSessionKey(e) {
    return bV({
        scope: "job",
        readableName: e.jobId,
        identityTuple: ["job", e.jobId.trim(), e.ownerSession?.trim() ?? "", e.cron?.trim() ?? "", e.cwdRel?.trim() ?? ""].join("|")
    })
}
