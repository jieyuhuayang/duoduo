// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildProfiledExternalRequirement  (minified: Yke, daemon.pretty.js:69961)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildProfiledExternalRequirement(e, t) {
    return {
        kind: "profiled-external",
        model: e,
        requiredMaxContextTokens: t.cap,
        ...t.baseUrl ? {
            baseUrl: t.baseUrl
        } : {},
        ...t.auth ? {
            auth: t.auth
        } : {},
        source: t.source
    }
}
