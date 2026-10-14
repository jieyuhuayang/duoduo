// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: loadGlobalRuntimeConfig  (minified: li, daemon.pretty.js:36772)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// locals: 8 renamed — 4 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadGlobalRuntimeConfig(channelConfigDir) {
    let filePath = Kce.join(channelConfigDir, `${Yr}.md`),
        readResult = await Xce(filePath);
    if (readResult.status === "absent") return null;
    if (readResult.status === "unreadable") {
        let unparseableIssues = [{
            reason: "file-unparseable"
        }];
        return {
            claudeModelProfileIssues: unparseableIssues,
            claudeModelAliasIssues: unparseableIssues
        }
    }
    let {
        claudeModelProfiles,
        claudeModelProfileIssues,
        claudeModelAliases,
        claudeModelAliasIssues
    } = parseClaudeFrontmatterBlock(readResult.data);
    return yI(filePath, claudeModelProfileIssues), yI(filePath, claudeModelAliasIssues, "claude.model_aliases"), {
        claudeModelProfiles,
        claudeModelProfileIssues,
        claudeModelAliases,
        claudeModelAliasIssues,
        ...BU(readResult.data),
        ...VU(readResult.data)
    }
}
