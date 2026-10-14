// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: realpathOrSelf  (minified: ibt, daemon.pretty.js:82594)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function realpathOrSelf(filePath) {
    try {
        return await MRe.realpath(filePath)
    } catch {
        return filePath
    }
}
