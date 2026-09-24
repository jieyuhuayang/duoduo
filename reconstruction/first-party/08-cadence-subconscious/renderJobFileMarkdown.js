// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderJobFileMarkdown  (minified: Sst, daemon.pretty.js:61257)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobFileMarkdown(e, t) {
    let n = ["---"];
    n.push(`type: "${e.type}"`), n.push(`cron: "${e.cron}"`), n.push(`created_at: "${e.created_at}"`), e.owner_session && n.push(`owner_session: "${e.owner_session}"`), e.cwd_rel && n.push(`cwd_rel: "${e.cwd_rel}"`), e.runtime && n.push(`runtime: "${e.runtime}"`), e.model && n.push(`model: "${e.model}"`), e.effort && n.push(`effort: "${e.effort}"`), e.acceptance && n.push(`acceptance: ${JSON.stringify(e.acceptance)}`), e.stateless === !0 && n.push("stateless: true"), e.prompt_mode === "override" && n.push('prompt_mode: "override"');
    for (let r of ["allowedTools", "disallowedTools", "additionalDirectories"]) {
        let i = e[r];
        if (i && i.length > 0) {
            n.push(`${r}:`);
            for (let o of i) n.push(`  - ${JSON.stringify(o)}`)
        }
    }
    if (e.claudeTools && e.claudeTools.length > 0) {
        n.push("claude:"), n.push("  tools:");
        for (let r of e.claudeTools) n.push(`    - ${JSON.stringify(r)}`)
    }
    return n.push("---"), n.push(""), n.push(t), n.join(`
`)
}
