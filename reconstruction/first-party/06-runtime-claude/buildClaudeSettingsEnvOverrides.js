// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildClaudeSettingsEnvOverrides  (minified: lut, daemon.pretty.js:65353)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildClaudeSettingsEnvOverrides(e) {
    let t = {},
        n = e.requirement;
    n?.kind === "profiled-external" && (t[sut] = String(n.requiredMaxContextTokens), n.baseUrl && (t[aut] = n.baseUrl), n.auth && (t[out[n.auth.field]] = n.auth.token));
    for (let r of Zd) {
        let i = e.aliases?.[r];
        i && (t[iut[r]] = i)
    }
    return Object.keys(t).length === 0 ? void 0 : t
}
