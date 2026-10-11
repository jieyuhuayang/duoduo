// duoduo reconstruction — subsystem: 03-session-actor
// symbol: computeStreamingConfigSignature  (minified: xG, daemon.pretty.js:82903)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeStreamingConfigSignature(options, boardHash) {
    let claudeContextRequirement = options.claudeContextRequirement,
        contextModel = claudeContextRequirement?.modelOrigin !== void 0 ? claudeContextRequirement.model ?? null : null;
    return JSON.stringify({
        cwd: options.cwd,
        settingSources: options.settingSources ?? [],
        persistSession: options.persistSession,
        permissionMode: options.permissionMode,
        allowedTools: options.allowedTools ?? [],
        disallowedTools: options.disallowedTools ?? [],
        tools: options.tools ?? [],
        additionalDirectories: options.additionalDirectories ?? [],
        autoloadAdditionalDirectoryClaudeMd: options.autoloadAdditionalDirectoryClaudeMd,
        [SN]: boardHash,
        [zRe]: contextModel
    })
}
