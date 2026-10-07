// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: mergeClaudeToolLists  (minified: wve, daemon.pretty.js:65723)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.5.10 (medium): anything else ... is off unless explicitly added via a new nested `claude.tools` key in a channel's kind or instance descriptor.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeClaudeToolLists(e, t) {
    if (!(e === void 0 && t === void 0)) return [...new Set([...e ?? [], ...t ?? []])]
}
