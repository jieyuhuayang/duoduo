// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveLayeredChannelRuntime  (minified: Ua, daemon.pretty.js:35477)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveLayeredChannelRuntime(e, t) {
    return e?.runtimeRefusal ? {
        ok: !1,
        reason: e.runtimeRefusal
    } : e?.runtime ? {
        ok: !0,
        runtime: e.runtime,
        source: "explicit"
    } : t?.runtimeRefusal ? {
        ok: !1,
        reason: t.runtimeRefusal
    } : t?.runtime ? {
        ok: !0,
        runtime: t.runtime,
        source: "inherited"
    } : {
        ok: !0,
        runtime: void 0,
        source: "default"
    }
}
