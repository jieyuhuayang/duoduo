// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: isBoardIncludePathCandidate  (minified: sbt, daemon.pretty.js:82632)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isBoardIncludePathCandidate(candidate) {
    return candidate.startsWith("./") || candidate.startsWith("~/") || ba.isAbsolute(candidate) && candidate !== ba.parse(candidate).root || !candidate.startsWith("@") && !/^[#%^&*()]+/.test(candidate) && /^[a-zA-Z0-9._-]/.test(candidate)
}
