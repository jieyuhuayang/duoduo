// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildPiSystemPromptSpec  (minified: Eht, daemon.pretty.js:73045)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): the same kind/instance/job/partition prompt fields including append-or-replace
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildPiSystemPromptSpec(systemPrompt) {
    if (!systemPrompt) return;
    if (typeof systemPrompt == "string") {
        let trimmed = systemPrompt.trim();
        return trimmed ? {
            mode: "override",
            text: trimmed
        } : void 0
    }
    let appendText = systemPrompt.append?.trim();
    return appendText ? {
        mode: "append",
        text: appendText
    } : void 0
}
