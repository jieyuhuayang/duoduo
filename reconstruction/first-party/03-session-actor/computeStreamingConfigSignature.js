// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeStreamingConfigSignature  (minified: fJ, daemon.pretty.js:82601)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeStreamingConfigSignature(e, t) {
    let n = e.claudeContextRequirement,
        r = n?.modelOrigin !== void 0 ? n.model ?? null : null;
    return JSON.stringify({
        cwd: e.cwd,
        settingSources: e.settingSources ?? [],
        persistSession: e.persistSession,
        permissionMode: e.permissionMode,
        allowedTools: e.allowedTools ?? [],
        disallowedTools: e.disallowedTools ?? [],
        tools: e.tools ?? [],
        additionalDirectories: e.additionalDirectories ?? [],
        autoloadAdditionalDirectoryClaudeMd: e.autoloadAdditionalDirectoryClaudeMd,
        [CA]: t,
        [KEe]: r
    })
}
