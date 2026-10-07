// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveClaudeContextRequirement  (minified: Jg, daemon.pretty.js:70133)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveClaudeContextRequirement(e) {
    let t = classifyModelContextRequirement({
        model: e.model,
        mergedCatalog: e.mergedCatalog,
        hostMaxContextTokens: e.hostMaxContextTokens
    });
    if (e.model) return t;
    let n = await _mt(e.cwd, e.daemonEnv);
    if (!n) return t;
    let r = classifyModelContextRequirement({
        model: n.model,
        mergedCatalog: e.mergedCatalog,
        hostMaxContextTokens: e.hostMaxContextTokens
    });
    return r.kind === "profiled-external" ? {
        ...r,
        modelOrigin: n.origin
    } : selectProfileIssuesForModel(r, e.issues).some(o => o.model !== void 0) ? r : t
}
