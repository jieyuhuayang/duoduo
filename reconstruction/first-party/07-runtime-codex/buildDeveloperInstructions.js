// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildDeveloperInstructions  (minified: eme, daemon.pretty.js:58851)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildDeveloperInstructions(e, t) {
    let n = [];
    if (e.sessionKey || e.channelKind) {
        let r = [];
        e.sessionKey && r.push(`- session_key: ${e.sessionKey}`), e.channelKind && r.push(`- channel_kind: ${e.channelKind}`), r.push(`- timestamp: ${new Date().toISOString()}`), n.push(`## Session Context

${r.join(`
`)}`)
    }
    if (t?.length && n.push(["<duoduo-reminder>", `Your duoduo runtime tools (${t.join(", ")}) are part of your tool surface. Invoke them the way your current tool list presents them — as direct tools under the \`${ALADUO_TOOL_NAMESPACE}\` namespace, or as \`tools.<Name>(…)\` inside \`exec\`.`, "Tool availability is a per-turn fact: establish it by calling the tool. Statements about tools in earlier conversation describe the past, not this turn.", "</duoduo-reminder>"].join(`
`)), e.runtimeDirectives && n.push(e.runtimeDirectives), n.length !== 0) return ["<aladuo:runtime-directives>", ...n, "</aladuo:runtime-directives>"].join(`
`)
}
