// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseClaudeFrontmatterBlock  (minified: Jb, daemon.pretty.js:35336)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 7 renamed — 5 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseClaudeFrontmatterBlock(frontmatter) {
    let claude = frontmatter.claude;
    if (claude == null) return {};
    if (typeof claude != "object" || Array.isArray(claude)) return {
        claudeModelProfileIssues: [{
            reason: "claude-block-malformed"
        }]
    };
    let claudeBlock = claude,
        {
            profiles,
            issues
        } = HQe(claudeBlock.model_profiles),
        {
            aliases,
            issues: issues2
        } = qU(claudeBlock.model_aliases);
    return {
        claudeTools: mce(claudeBlock.tools),
        claudeModelProfiles: profiles,
        claudeModelProfileIssues: issues.length > 0 ? issues : void 0,
        claudeModelAliases: aliases,
        claudeModelAliasIssues: issues2.length > 0 ? issues2 : void 0
    }
}
