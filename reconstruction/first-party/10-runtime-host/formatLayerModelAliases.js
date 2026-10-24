// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatLayerModelAliases  (minified: mPe, daemon.pretty.js:93732)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatLayerModelAliases(aliases, source) {
    let entries = Object.entries(aliases ?? {});
    if (entries.length !== 0) return entries.map(([tier, model]) => ({
        tier,
        model,
        source
    })).sort((a, b) => a.tier.localeCompare(b.tier))
}
