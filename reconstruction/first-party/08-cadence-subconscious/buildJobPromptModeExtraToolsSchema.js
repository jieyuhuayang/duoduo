// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobPromptModeExtraToolsSchema  (minified: Zve, daemon.pretty.js:65351)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobPromptModeExtraToolsSchema() {
    return {
        prompt_mode: ht.enum(["append", "override"]).describe(renderJobPromptModeDescription()).optional(),
        extra_tools: ht.array(ht.string()).describe(renderJobExtraToolsDescription()).optional()
    }
}
