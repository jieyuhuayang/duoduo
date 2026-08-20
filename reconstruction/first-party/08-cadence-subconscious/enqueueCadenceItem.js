// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: enqueueCadenceItem  (minified: Cot, daemon.pretty.js:78073)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueCadenceItem(e, t, n = new Date) {
    await xe(e.cadenceInboxDir);
    let i = `${n.toISOString().replace(/[:.]/g,"-")}_${Math.random().toString(36).slice(2)}.pending`,
        o = xC.join(e.cadenceInboxDir, i);
    return await qt(o, `${t.trim()}
`), o
}
