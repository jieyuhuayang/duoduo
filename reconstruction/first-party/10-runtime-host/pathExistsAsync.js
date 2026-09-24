// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: pathExistsAsync  (minified: $s, daemon.pretty.js:68928)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function pathExistsAsync(e) {
    try {
        return await Qct.access(e), !0
    } catch {
        return !1
    }
}
