// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: selectDominantModelByInputTokens  (minified: cot, daemon.pretty.js:55154)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (medium): The footer also shows which model was actually billed (served model may differ from the requested model). The footer reflects per-turn deltas, not process-global accumulators.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectDominantModelByInputTokens(modelUsage) {
    if (!modelUsage || typeof modelUsage != "object") return;
    let dominantModel, maxInputTokens = 0,
        isTied = !1;
    for (let [model, usage] of Object.entries(modelUsage)) {
        let inputTokens = usage && typeof usage == "object" && typeof usage.inputTokens == "number" ? usage.inputTokens : 0;
        inputTokens > maxInputTokens ? (maxInputTokens = inputTokens, dominantModel = model, isTied = !1) : inputTokens === maxInputTokens && maxInputTokens > 0 && (isTied = !0)
    }
    if (!isTied) return dominantModel
}
