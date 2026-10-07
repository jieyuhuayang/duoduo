// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseClaudeFrontmatterBlock  (minified: Jb, daemon.pretty.js:35336)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
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
        } = qQe(n.model_profiles),
        {
            aliases: o,
            issues: s
        } = qU(n.model_aliases);
    return {
        claudeTools: pce(n.tools),
        claudeModelProfiles: r,
        claudeModelProfileIssues: i.length > 0 ? i : void 0,
        claudeModelAliases: o,
        claudeModelAliasIssues: s.length > 0 ? s : void 0
    }
}
