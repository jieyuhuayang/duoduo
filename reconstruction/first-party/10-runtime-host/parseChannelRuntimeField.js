// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseChannelRuntimeField  (minified: WQe, daemon.pretty.js:35468)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseChannelRuntimeField(e) {
    let t = validateKnownRuntimeValue(e, "This channel's config");
    return t.ok ? t.runtime === void 0 ? {} : {
        runtime: t.runtime
    } : {
        runtimeRefusal: t.reason
    }
}
