// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: buildProfiledExternalRequirement  (minified: aSe, daemon.pretty.js:69670)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
