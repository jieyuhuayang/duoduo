// duoduo reconstruction — subsystem: 09-memory
// symbol: mergeKernelGitignoreEntries  (minified: qpt, daemon.pretty.js:69295)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeKernelGitignoreEntries(e) {
    let t = Rke.join(e, ".gitignore"),
        n = "";
    try {
        n = await ES.readFile(t, "utf8")
    } catch {}
    let r = new Set(n.split(`
`).map(s => s.trim()).filter(s => s.length > 0)),
        i = zpt.filter(s => !r.has(s));
    if (i.length === 0) return;
    let o = (n.endsWith(`
`) || n.length === 0 ? "" : `
`) + i.join(`
`) + `
`;
    await ES.writeFile(t, n + o, "utf8"), logDebugMessage("[memory-git] merged .gitignore entries", {
        added: i
    })
}
