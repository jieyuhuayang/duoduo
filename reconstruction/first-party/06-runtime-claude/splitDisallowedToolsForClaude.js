// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: splitDisallowedToolsForClaude  (minified: Qoe, daemon.pretty.js:48116)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function splitDisallowedToolsForClaude(e) {
    let t = [],
        n = [];
    for (let r of e)(r.startsWith("mcp__") ? t : n).push(r);
    return {
        mcpTools: t,
        builtIns: n
    }
}
