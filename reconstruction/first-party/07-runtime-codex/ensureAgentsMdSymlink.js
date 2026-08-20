// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ensureAgentsMdSymlink  (minified: I2, daemon.pretty.js:58790)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureAgentsMdSymlink(e) {
    let {
        existsSync: t,
        promises: n
    } = await import("node:fs"), r = await import("node:path"), i = r.join(e, "CLAUDE.md"), o = r.join(e, "AGENTS.md");
    t(i) && (t(o) || (await n.symlink("CLAUDE.md", o), Ae("[codex] created AGENTS.md symlink", {
        dir: e
    })))
}
