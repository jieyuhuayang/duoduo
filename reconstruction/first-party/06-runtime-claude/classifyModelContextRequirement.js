// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: classifyModelContextRequirement  (minified: ZW, daemon.pretty.js:71190)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 3 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyModelContextRequirement({
    model,
    mergedCatalog,
    hostMaxContextTokens
}) {
    if (!model) return gEe(null, hostMaxContextTokens);
    if (model.startsWith(uq)) return {
        kind: "native-claude",
        model,
        requiredMaxContextTokens: void 0
    };
    if (model.endsWith(ah)) {
        let baseModel = KW(model);
        return Object.hasOwn(mergedCatalog, baseModel) ? buildProfiledExternalRequirement(model, mergedCatalog[baseModel]) : {
            kind: "explicit-1m",
            model,
            requiredMaxContextTokens: void 0
        }
    }
    return Object.hasOwn(mergedCatalog, model) ? buildProfiledExternalRequirement(model, mergedCatalog[model]) : gEe(model, hostMaxContextTokens)
}
