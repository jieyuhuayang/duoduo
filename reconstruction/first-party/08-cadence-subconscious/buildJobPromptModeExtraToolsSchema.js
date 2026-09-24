// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: buildJobPromptModeExtraToolsSchema  (minified: c_e, daemon.pretty.js:63761)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildJobPromptModeExtraToolsSchema() {
    return {
        prompt_mode: ft.enum(["append", "override"]).describe(renderJobPromptModeDescription()).optional(),
        extra_tools: ft.array(ft.string()).describe(renderJobExtraToolsDescription()).optional()
    }
}
