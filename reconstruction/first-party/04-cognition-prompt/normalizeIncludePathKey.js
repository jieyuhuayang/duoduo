// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: normalizeIncludePathKey  (minified: ORe, daemon.pretty.js:82556)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeIncludePathKey(filePath) {
    let resolved = ba.resolve(filePath);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved
}
