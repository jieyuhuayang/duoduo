// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildBaseInstructions  (minified: lbe, daemon.pretty.js:62248)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.1 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (medium): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildBaseInstructions(context, runnerSystemPrompt) {
    let sections = [];
    context.identity && sections.push(`## Identity

${context.identity}`);
    let channelPrompts = [context.kindPrompt, context.instancePrompt].filter(Boolean);
    if (channelPrompts.length > 0 && sections.push(`## Channel Configuration

${channelPrompts.join(`

`)}`), context.memoryBoard && context.memoryBoard.content.trim().length > 0 && sections.push(`Contents of ${context.memoryBoard.path} (intuition layer, written by my subconscious — already shaping me):

${context.memoryBoard.content.trim()}`), runnerSystemPrompt && sections.push(`## Runner System Prompt

${runnerSystemPrompt}`), sections.length !== 0) return ["<aladuo:system-context>", "The following is injected by the duoduo runtime. It is NOT part of the project codebase.", "", ...sections, "</aladuo:system-context>"].join(`
`)
}
