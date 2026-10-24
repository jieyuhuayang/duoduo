// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildProfiledExternalRequirement  (minified: W0e, daemon.pretty.js:72044)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildProfiledExternalRequirement(model, profile) {
    return {
        kind: "profiled-external",
        model,
        requiredMaxContextTokens: profile.cap,
        ...profile.baseUrl ? {
            baseUrl: profile.baseUrl
        } : {},
        ...profile.auth ? {
            auth: profile.auth
        } : {},
        source: profile.source
    }
}
