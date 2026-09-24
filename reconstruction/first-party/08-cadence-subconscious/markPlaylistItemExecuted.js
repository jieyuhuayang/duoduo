// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: markPlaylistItemExecuted  (minified: H$, daemon.pretty.js:66292)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markPlaylistItemExecuted(e, t, n = new Date) {
    let r;
    try {
        r = await Gu.readFile(e.subconsciousPlaylistPath, "utf8")
    } catch {
        return
    }
    let i = r.split(`
`),
        o = !1;
    for (let u = 0; u < i.length; u++) i[u].trim() === `- [ ] ${t}` && !o && (i[u] = i[u].replace("- [ ]", "- [x]"), o = !0);
    if (!o) return;
    let s = `- ${n.toISOString()} executed=${t}`,
        a = i.findIndex(u => u.trim() === "## History");
    a !== -1 ? i.splice(a + 1, 0, s) : i.push("", "## History", s), await Dt(e.subconsciousPlaylistPath, `${i.join(`
`).replace(/\s+$/,"")}
`)
}
