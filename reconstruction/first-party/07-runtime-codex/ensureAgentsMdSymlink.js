// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ensureAgentsMdSymlink  (minified: DU, daemon.pretty.js:57439)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureAgentsMdSymlink(e) {
    let {
        existsSync: t,
        promises: n
    } = await import("node:fs"), r = await import("node:path"), i = r.join(e, "CLAUDE.md"), s = r.join(e, "AGENTS.md");
    t(i) && (t(s) || (await n.symlink("CLAUDE.md", s), Pe("[codex] created AGENTS.md symlink", {
        dir: e
    })))
}
