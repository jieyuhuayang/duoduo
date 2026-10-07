// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ensureAgentsMdSymlink  (minified: P6, daemon.pretty.js:62206)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.4 (high): Auto-symlink `AGENTS.md` to `CLAUDE.md` for Codex sessions
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureAgentsMdSymlink(e) {
    let {
        existsSync: t,
        promises: n
    } = await import("node:fs"), r = await import("node:path"), i = r.join(e, "CLAUDE.md"), o = r.join(e, "AGENTS.md");
    t(i) && (t(o) || (await n.symlink("CLAUDE.md", o), logDebugMessage("[codex] created AGENTS.md symlink", {
        dir: e
    })))
}
