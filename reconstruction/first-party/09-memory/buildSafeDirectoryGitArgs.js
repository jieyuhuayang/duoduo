// duoduo reconstruction — subsystem: 09-memory
// symbol: buildSafeDirectoryGitArgs  (minified: Ake, daemon.pretty.js:69271)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSafeDirectoryGitArgs(dir, args) {
    return ["-c", `safe.directory=${dir}`, ...args]
}
