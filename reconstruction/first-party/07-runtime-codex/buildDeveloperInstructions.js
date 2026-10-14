// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildDeveloperInstructions  (minified: pbe, daemon.pretty.js:62267)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.7.1 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (medium): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildDeveloperInstructions(context, toolNames) {
    let sections = [];
    if (context.sessionKey || context.channelKind) {
        let contextLines = [];
        context.sessionKey && contextLines.push(`- session_key: ${context.sessionKey}`), context.channelKind && contextLines.push(`- channel_kind: ${context.channelKind}`), contextLines.push(`- timestamp: ${new Date().toISOString()}`), sections.push(`## Session Context

${contextLines.join(`
`)}`)
    }
    if (toolNames?.length && sections.push(["<duoduo-reminder>", `Your duoduo runtime tools (${toolNames.join(", ")}) are part of your tool surface. Invoke them the way your current tool list presents them — as direct tools under the \`${ALADUO_TOOL_NAMESPACE}\` namespace, or as \`tools.<Name>(…)\` inside \`exec\`.`, "Tool availability is a per-turn fact: establish it by calling the tool. Statements about tools in earlier conversation describe the past, not this turn.", "</duoduo-reminder>"].join(`
`)), context.runtimeDirectives && sections.push(context.runtimeDirectives), sections.length !== 0) return ["<aladuo:runtime-directives>", ...sections, "</aladuo:runtime-directives>"].join(`
`)
}
