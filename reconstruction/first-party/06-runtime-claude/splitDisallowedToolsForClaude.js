// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: splitDisallowedToolsForClaude  (minified: Phe, daemon.pretty.js:54950)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
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
