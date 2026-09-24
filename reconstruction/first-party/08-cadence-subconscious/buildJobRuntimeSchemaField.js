// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobRuntimeSchemaField  (minified: f_e, daemon.pretty.js:63777)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobRuntimeSchemaField(e) {
    let t = listSelectableJobRuntimes(),
        n = e && t.includes(e) ? e : t[0];
    return {
        runtime: ft.enum(t).optional().default(n).describe(yat(t, e))
    }
}
