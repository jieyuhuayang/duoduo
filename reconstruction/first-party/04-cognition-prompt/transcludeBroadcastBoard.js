// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: CTe, daemon.pretty.js:84627)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 1 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (high): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph into both Claude and Codex sessions through one path.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(boardPath) {
    let boardIncludes = await resolveBoardIncludes(va.resolve(boardPath), new Set);
    return {
        files: boardIncludes,
        rendered: renderTranscludedFiles(boardIncludes)
    }
}
