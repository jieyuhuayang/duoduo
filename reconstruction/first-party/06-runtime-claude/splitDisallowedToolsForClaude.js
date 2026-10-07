// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: splitDisallowedToolsForClaude  (minified: Kge, daemon.pretty.js:55266)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.10 (high): `disallowedTools` entries naming built-in tools are now no-ops (MCP tool names still work)
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
