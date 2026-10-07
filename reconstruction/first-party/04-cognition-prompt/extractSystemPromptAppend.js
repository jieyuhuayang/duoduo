// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: extractSystemPromptAppend  (minified: ube, daemon.pretty.js:62244)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.4 (medium): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractSystemPromptAppend(e) {
    if (e) return typeof e == "string" ? e.trim() || void 0 : e.append?.trim() || void 0
}
