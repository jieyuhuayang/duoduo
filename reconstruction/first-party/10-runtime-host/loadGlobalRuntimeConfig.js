// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadGlobalRuntimeConfig  (minified: li, daemon.pretty.js:36772)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadGlobalRuntimeConfig(e) {
    let t = Zce.join(e, `${Yr}.md`),
        n = await Yce(t);
    if (n.status === "absent") return null;
    if (n.status === "unreadable") {
        let a = [{
            reason: "file-unparseable"
        }];
        return {
            claudeModelProfileIssues: a,
            claudeModelAliasIssues: a
        }
    }
    let {
        claudeModelProfiles: r,
        claudeModelProfileIssues: i,
        claudeModelAliases: o,
        claudeModelAliasIssues: s
    } = parseClaudeFrontmatterBlock(n.data);
    return yI(t, i), yI(t, s, "claude.model_aliases"), {
        claudeModelProfiles: r,
        claudeModelProfileIssues: i,
        claudeModelAliases: o,
        claudeModelAliasIssues: s,
        ...BU(n.data),
        ...VU(n.data)
    }
}
