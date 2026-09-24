// duoduo reconstruction — subsystem: 03-session-actor
// symbol: memoizeAvailabilityProbeUntilOk  (minified: u0e, daemon.pretty.js:83644)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function memoizeAvailabilityProbeUntilOk(e) {
    let t = null;
    return () => (t ??= e().then(n => (n.ok || (t = null), n), n => {
        throw t = null, n
    }), t)
}
