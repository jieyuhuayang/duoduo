// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildDeveloperInstructions  (minified: Nle, daemon.pretty.js:57376)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildDeveloperInstructions(e) {
    let t = [];
    if (e.sessionKey || e.channelKind) {
        let n = [];
        e.sessionKey && n.push(`- session_key: ${e.sessionKey}`), e.channelKind && n.push(`- channel_kind: ${e.channelKind}`), n.push(`- timestamp: ${new Date().toISOString()}`), t.push(`## Session Context

${n.join(`
`)}`)
    }
    if (e.runtimeDirectives && t.push(e.runtimeDirectives), t.length !== 0) return ["<aladuo:runtime-directives>", ...t, "</aladuo:runtime-directives>"].join(`
`)
}
