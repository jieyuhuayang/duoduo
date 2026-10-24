// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: computeContextProfileSignature  (minified: _S, daemon.pretty.js:67762)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeContextProfileSignature(params) {
    let requirement = params.requirement,
        profiledRequirement = requirement?.kind === "profiled-external" ? requirement : void 0,
        authTokenHash = profiledRequirement?.auth ? lSe.createHash("sha256").update(profiledRequirement.auth.token).digest("hex").slice(0, 16) : null,
        aliasEntries = ff.flatMap(tier => {
            let aliasModel = params.aliases?.[tier];
            return aliasModel ? [
                [tier, aliasModel]
            ] : []
        });
    return JSON.stringify([params.capToken, profiledRequirement?.baseUrl ?? null, profiledRequirement?.auth?.field ?? null, authTokenHash, aliasEntries])
}
