// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: collectGrokToolCallNames  (minified: Swe, daemon.pretty.js:65448)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectGrokToolCallNames(toolCall) {
    let meta = coerceToPlainObject(toolCall._meta);
    return [coerceToPlainObject(meta["x.ai/tool"]).name, toolCall.name, toolCall.toolName, toolCall.title, toolCall.kind].filter(name => typeof name == "string" && name.length > 0)
}
