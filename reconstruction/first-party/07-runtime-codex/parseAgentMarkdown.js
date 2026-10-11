// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: parseAgentMarkdown  (minified: Vke, daemon.pretty.js:69610)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 8 renamed — 0 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseAgentMarkdown(filePath, content) {
    let parsed = (0, Bke.default)(content, Sr),
        frontmatter = parsed.data ?? {},
        baseName = pa.basename(filePath, ".md"),
        name = (typeof frontmatter.name == "string" && frontmatter.name.trim().length > 0 ? frontmatter.name.trim() : void 0) ?? baseName,
        description = typeof frontmatter.description == "string" && frontmatter.description.trim().length > 0 ? frontmatter.description.trim() : `Agent ${name}`,
        body = parsed.content.replace(/^\s+/, "").replace(/\s+$/, "");
    if (body.length === 0) throw new Error(`[codex-agents-generator] ${filePath} has empty body after frontmatter`);
    return {
        name,
        description,
        developerInstructions: body
    }
}
