// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobRuntimeSchemaField  (minified: Abe, daemon.pretty.js:64096)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.0 (medium): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobRuntimeSchemaField(e) {
    let t = listSelectableJobRuntimes(),
        n = e && isSupportedRuntime(e) && t.includes(e) ? e : t[0];
    return {
        runtime: mt.enum(t).optional().default(n).describe(dlt(t, e))
    }
}
