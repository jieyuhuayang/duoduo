// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobRuntimeSchemaField  (minified: Abe, daemon.pretty.js:64096)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobRuntimeSchemaField(e) {
    let t = listSelectableJobRuntimes(),
        n = e && isSupportedRuntime(e) && t.includes(e) ? e : t[0];
    return {
        runtime: mt.enum(t).optional().default(n).describe(dlt(t, e))
    }
}
