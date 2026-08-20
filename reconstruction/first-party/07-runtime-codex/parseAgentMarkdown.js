// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: parseAgentMarkdown  (minified: Nme, daemon.pretty.js:60949)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseAgentMarkdown(e, t) {
    let n = (0, Ame.default)(t, Cr),
        r = n.data ?? {},
        i = Ds.basename(e, ".md"),
        s = (typeof r.name == "string" && r.name.trim().length > 0 ? r.name.trim() : void 0) ?? i,
        a = typeof r.description == "string" && r.description.trim().length > 0 ? r.description.trim() : `Agent ${s}`,
        l = n.content.replace(/^\s+/, "").replace(/\s+$/, "");
    if (l.length === 0) throw new Error(`[codex-agents-generator] ${e} has empty body after frontmatter`);
    return {
        name: s,
        description: a,
        developerInstructions: l
    }
}
