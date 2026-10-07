// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: MRe, daemon.pretty.js:82499)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (high): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph into both Claude and Codex sessions through one path.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(e) {
    let t = await resolveBoardIncludes(ba.resolve(e), new Set);
    return {
        files: t,
        rendered: renderTranscludedFiles(t)
    }
}
