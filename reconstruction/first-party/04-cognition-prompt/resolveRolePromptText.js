// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveRolePromptText  (minified: qV, daemon.pretty.js:56648)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 3 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRolePromptText(role) {
    let optionalEnvString = normalizeOptionalEnvString(process.env.ALADUO_META_PROMPT_PATH),
        optionalEnvString2 = normalizeOptionalEnvString(process.env.ALADUO_BOOTSTRAP_DIR),
        candidatePaths = [optionalEnvString ? xg.join(xg.dirname(optionalEnvString), "roles", `${role}.md`) : void 0, optionalEnvString2 ? xg.join(optionalEnvString2, "roles", `${role}.md`) : void 0].filter(candidatePath => !!candidatePath);
    for (let rolePath of candidatePaths) try {
        if (!gC(rolePath)) continue;
        let trimmed = LV(rolePath, "utf8").trim();
        if (trimmed.length > 0) return trimmed
    } catch {}
}
