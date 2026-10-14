// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: isGrokSkipToolCall  (minified: But, daemon.pretty.js:63375)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isGrokSkipToolCall(toolCall) {
    return collectGrokToolCallNames(toolCall).some(Uut)
}
