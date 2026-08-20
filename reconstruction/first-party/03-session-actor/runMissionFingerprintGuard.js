// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runMissionFingerprintGuard  (minified: lot, daemon.pretty.js:74284)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMissionFingerprintGuard(e, t, n, r, i, o) {
    return runInstructionsFingerprintGuard(e, t, {
        mission: r
    }, i, {
        mission_fingerprint: o.mission_fingerprint,
        schema_version: o.schema_version,
        sdk_session_id: o.sdk_session_id
    }, {
        jobId: n
    })
}
