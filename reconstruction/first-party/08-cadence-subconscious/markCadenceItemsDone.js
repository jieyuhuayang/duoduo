// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: markCadenceItemsDone  (minified: cet, daemon.pretty.js:74762)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markCadenceItemsDone(e, t) {
    if (t.length === 0) return;
    let r = (await fd.readFile(e.cadenceQueuePath, "utf8")).split(`
`).map(i => i.trim().startsWith("- [ ]") && t.includes(i.trim()) ? i.replace("- [ ]", "- [x]") : i).join(`
`);
    await Mt(e.cadenceQueuePath, `${r.replace(/\s+$/,"")}
`)
}
