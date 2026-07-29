// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runMissionFingerprintGuard  (minified: net, daemon.pretty.js:71618)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMissionFingerprintGuard(e, t, n, r, i, s) {
    return runInstructionsFingerprintGuard(e, t, {
        mission: r
    }, i, {
        mission_fingerprint: s.mission_fingerprint,
        schema_version: s.schema_version,
        sdk_session_id: s.sdk_session_id
    }, {
        jobId: n
    })
}
