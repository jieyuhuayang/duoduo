// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildManageJobInputSchema  (minified: ZC, daemon.pretty.js:64104)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildManageJobInputSchema(e) {
    return {
        ...Obe,
        ...$be(),
        ...buildJobPromptModeExtraToolsSchema(),
        ...buildJobRuntimeSchemaField(e)
    }
}
