// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveMetaPromptText  (minified: xw, daemon.pretty.js:55385)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 3 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMetaPromptText() {
    let optionalEnvString = normalizeOptionalEnvString(process.env.ALADUO_META_PROMPT_PATH),
        optionalEnvString2 = normalizeOptionalEnvString(process.env.ALADUO_BOOTSTRAP_DIR),
        candidatePaths = [optionalEnvString, optionalEnvString2 ? mV.join(optionalEnvString2, "meta-prompt.md") : void 0].filter(candidate => !!candidate);
    for (let candidatePath of candidatePaths) try {
        if (!pV(candidatePath)) continue;
        let trimmed = Gge(candidatePath, "utf8").trim();
        if (trimmed.length > 0) return trimmed
    } catch {}
}
