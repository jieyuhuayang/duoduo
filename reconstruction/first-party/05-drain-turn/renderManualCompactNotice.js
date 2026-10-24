// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderManualCompactNotice  (minified: ebt, daemon.pretty.js:74428)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderManualCompactNotice(result) {
    let hasPre = typeof result.pre_tokens == "number",
        hasPost = typeof result.post_tokens == "number";
    return hasPre && hasPost ? `📦 History compacted (${result.pre_tokens} → ${result.post_tokens} tokens).` : hasPre ? `📦 History compacted (pre: ${result.pre_tokens} tokens).` : "📦 History compacted."
}
