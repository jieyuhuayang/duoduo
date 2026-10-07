// duoduo reconstruction — subsystem: 03-session-actor
// symbol: memoizeAvailabilityProbeUntilOk  (minified: XRe, daemon.pretty.js:83957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.3 (medium): A failed check is no longer remembered either: the next message checks again, so installing Codex takes effect without a restart.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function memoizeAvailabilityProbeUntilOk(e) {
    let t = null;
    return () => (t ??= e().then(n => (n.ok || (t = null), n), n => {
        throw t = null, n
    }), t)
}
