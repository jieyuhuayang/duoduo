// duoduo reconstruction — subsystem: 03-session-actor
// symbol: assertJobWorkspaceUsable  (minified: Y_e, daemon.pretty.js:61454)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function assertJobWorkspaceUsable(e) {
    if (e.context !== "workspace") return;
    let t = await zC.stat(e.cwd).catch(() => null);
    if (!t || !t.isDirectory()) throw new Error(`Job workspace '${e.cwdRel}' no longer exists. cwd_rel points to a directory that must exist with a CLAUDE.md context file; it was present when the job was created but is now missing.`);
    let n = $c.join(e.cwd, "CLAUDE.md"),
        r = await zC.stat(n).catch(() => null);
    if (!r || !r.isFile()) throw new Error(`Job workspace '${e.cwdRel}' is missing CLAUDE.md. cwd_rel requires a CLAUDE.md context file so the job session has project-level instructions; it was present when the job was created but is now missing.`)
}
