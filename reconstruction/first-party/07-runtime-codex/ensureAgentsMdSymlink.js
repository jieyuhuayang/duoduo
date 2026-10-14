// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ensureAgentsMdSymlink  (minified: $6, daemon.pretty.js:62207)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 2 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): Auto-symlink `AGENTS.md` to `CLAUDE.md` for Codex sessions
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureAgentsMdSymlink(dir) {
    let {
        existsSync,
        promises
    } = await import("node:fs"), path = await import("node:path"), claudeMdPath = path.join(dir, "CLAUDE.md"), agentsMdPath = path.join(dir, "AGENTS.md");
    existsSync(claudeMdPath) && (existsSync(agentsMdPath) || (await promises.symlink("CLAUDE.md", agentsMdPath), logDebugMessage("[codex] created AGENTS.md symlink", {
        dir
    })))
}
