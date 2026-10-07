// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobPromptModeExtraToolsSchema  (minified: Cbe, daemon.pretty.js:64080)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobPromptModeExtraToolsSchema() {
    return {
        prompt_mode: mt.enum(["append", "override"]).describe(renderJobPromptModeDescription()).optional(),
        extra_tools: mt.array(mt.string()).describe(renderJobExtraToolsDescription()).optional()
    }
}
