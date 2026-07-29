// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: parseAgentMarkdown  (minified: ude, daemon.pretty.js:58693)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseAgentMarkdown(e, t) {
    let n = (0, cde.default)(t),
        r = n.data ?? {},
        i = yo.basename(e, ".md"),
        o = (typeof r.name == "string" && r.name.trim().length > 0 ? r.name.trim() : void 0) ?? i,
        a = typeof r.description == "string" && r.description.trim().length > 0 ? r.description.trim() : `Agent ${o}`,
        c = n.content.replace(/^\s+/, "").replace(/\s+$/, "");
    if (c.length === 0) throw new Error(`[codex-agents-generator] ${e} has empty body after frontmatter`);
    return {
        name: o,
        description: a,
        developerInstructions: c
    }
}
