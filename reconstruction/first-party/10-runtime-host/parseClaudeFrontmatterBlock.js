// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseClaudeFrontmatterBlock  (minified: Sb, daemon.pretty.js:35237)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseClaudeFrontmatterBlock(e) {
    let t = e.claude;
    if (t == null) return {};
    if (typeof t != "object" || Array.isArray(t)) return {
        claudeModelProfileIssues: [{
            reason: "claude-block-malformed"
        }]
    };
    let n = t,
        {
            profiles: r,
            issues: i
        } = G7e(n.model_profiles),
        {
            aliases: o,
            issues: s
        } = Uz(n.model_aliases);
    return {
        claudeTools: Yue(n.tools),
        claudeModelProfiles: r,
        claudeModelProfileIssues: i.length > 0 ? i : void 0,
        claudeModelAliases: o,
        claudeModelAliasIssues: s.length > 0 ? s : void 0
    }
}
