// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobRuntimeSchemaField  (minified: Abe, daemon.pretty.js:64096)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobRuntimeSchemaField(preferredRuntime) {
    let selectableJobRuntimes = listSelectableJobRuntimes(),
        defaultRuntime = preferredRuntime && isSupportedRuntime(preferredRuntime) && selectableJobRuntimes.includes(preferredRuntime) ? preferredRuntime : selectableJobRuntimes[0];
    return {
        runtime: mt.enum(selectableJobRuntimes).optional().default(defaultRuntime).describe(dlt(selectableJobRuntimes, preferredRuntime))
    }
}
