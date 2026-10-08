// duoduo reconstruction — subsystem: 03-session-actor
// symbol: extractJobSdkConfig  (minified: rbe, daemon.pretty.js:61594)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractJobSdkConfig(e) {
    if (!e) return;
    let {
        prompt_mode: t,
        allowedTools: n,
        disallowedTools: r,
        additionalDirectories: i,
        claudeTools: o,
        claudeModelProfiles: s,
        claudeModelProfileIssues: a,
        claudeModelAliases: u,
        claudeModelAliasIssues: l
    } = e;
    if (!(t === void 0 && n === void 0 && r === void 0 && i === void 0 && o === void 0 && s === void 0 && a === void 0 && u === void 0 && l === void 0)) return {
        prompt_mode: t,
        allowedTools: n,
        disallowedTools: r,
        additionalDirectories: i,
        claudeTools: o,
        claudeModelProfiles: s,
        claudeModelProfileIssues: a,
        claudeModelAliases: u,
        claudeModelAliasIssues: l
    }
}
