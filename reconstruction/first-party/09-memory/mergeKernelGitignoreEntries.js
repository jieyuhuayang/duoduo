// duoduo reconstruction — subsystem: 09-memory
// symbol: mergeKernelGitignoreEntries  (minified: odt, daemon.pretty.js:69004)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeKernelGitignoreEntries(e) {
    let t = Mwe.join(e, ".gitignore"),
        n = "";
    try {
        n = await Gw.readFile(t, "utf8")
    } catch {}
    let r = new Set(n.split(`
`).map(s => s.trim()).filter(s => s.length > 0)),
        i = rdt.filter(s => !r.has(s));
    if (i.length === 0) return;
    let o = (n.endsWith(`
`) || n.length === 0 ? "" : `
`) + i.join(`
`) + `
`;
    await Gw.writeFile(t, n + o, "utf8"), Re("[memory-git] merged .gitignore entries", {
        added: i
    })
}
