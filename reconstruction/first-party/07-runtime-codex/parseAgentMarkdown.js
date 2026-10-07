// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: parseAgentMarkdown  (minified: Vke, daemon.pretty.js:69610)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseAgentMarkdown(e, t) {
    let n = (0, Bke.default)(t, Sr),
        r = n.data ?? {},
        i = pa.basename(e, ".md"),
        s = (typeof r.name == "string" && r.name.trim().length > 0 ? r.name.trim() : void 0) ?? i,
        a = typeof r.description == "string" && r.description.trim().length > 0 ? r.description.trim() : `Agent ${s}`,
        u = n.content.replace(/^\s+/, "").replace(/\s+$/, "");
    if (u.length === 0) throw new Error(`[codex-agents-generator] ${e} has empty body after frontmatter`);
    return {
        name: s,
        description: a,
        developerInstructions: u
    }
}
