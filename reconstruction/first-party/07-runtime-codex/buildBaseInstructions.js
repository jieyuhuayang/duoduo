// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildBaseInstructions  (minified: lbe, daemon.pretty.js:62248)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.1 (maps/history_daemon.json)
// changelog v0.4.4 (medium): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildBaseInstructions(e, t) {
    let n = [];
    e.identity && n.push(`## Identity

${e.identity}`);
    let r = [e.kindPrompt, e.instancePrompt].filter(Boolean);
    if (r.length > 0 && n.push(`## Channel Configuration

${r.join(`

`)}`), e.memoryBoard && e.memoryBoard.content.trim().length > 0 && n.push(`Contents of ${e.memoryBoard.path} (intuition layer, written by my subconscious — already shaping me):

${e.memoryBoard.content.trim()}`), t && n.push(`## Runner System Prompt

${t}`), n.length !== 0) return ["<aladuo:system-context>", "The following is injected by the duoduo runtime. It is NOT part of the project codebase.", "", ...n, "</aladuo:system-context>"].join(`
`)
}
