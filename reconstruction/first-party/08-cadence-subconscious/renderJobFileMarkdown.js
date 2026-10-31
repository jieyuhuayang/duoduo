// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderJobFileMarkdown  (minified: Act, daemon.pretty.js:62847)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.4, v0.5.4, v0.5.6, v0.6.2, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): fix(job): serialize runtime field in frontmatter
// changelog v0.5.4 (high): A periodic job that does not depend on prior-run state can set `stateless: true`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobFileMarkdown(frontmatter, body) {
    let lines = ["---"];
    lines.push(`type: "${frontmatter.type}"`), lines.push(`cron: "${frontmatter.cron}"`), lines.push(`created_at: "${frontmatter.created_at}"`), frontmatter.owner_session && lines.push(`owner_session: "${frontmatter.owner_session}"`), frontmatter.cwd_rel && lines.push(`cwd_rel: "${frontmatter.cwd_rel}"`), frontmatter.runtime && lines.push(`runtime: "${frontmatter.runtime}"`), frontmatter.model && lines.push(`model: "${frontmatter.model}"`), frontmatter.effort && lines.push(`effort: "${frontmatter.effort}"`), frontmatter.acceptance && lines.push(`acceptance: ${JSON.stringify(frontmatter.acceptance)}`), frontmatter.stateless === !0 && lines.push("stateless: true"), frontmatter.prompt_mode === "override" && lines.push('prompt_mode: "override"');
    for (let listKey of ["allowedTools", "disallowedTools", "additionalDirectories"]) {
        let listValues = frontmatter[listKey];
        if (listValues && listValues.length > 0) {
            lines.push(`${listKey}:`);
            for (let item of listValues) lines.push(`  - ${JSON.stringify(item)}`)
        }
    }
    if (frontmatter.claudeTools && frontmatter.claudeTools.length > 0) {
        lines.push("claude:"), lines.push("  tools:");
        for (let tool of frontmatter.claudeTools) lines.push(`    - ${JSON.stringify(tool)}`)
    }
    return lines.push("---"), lines.push(""), lines.push(body), lines.join(`
`)
}
