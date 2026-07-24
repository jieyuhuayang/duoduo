// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: enqueueCadenceItem  (minified: uet, daemon.pretty.js:74714)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueCadenceItem(e, t, n = new Date) {
    await ge(e.cadenceInboxDir);
    let i = `${n.toISOString().replace(/[:.]/g,"-")}_${Math.random().toString(36).slice(2)}.pending`,
        s = YI.join(e.cadenceInboxDir, i);
    return await Mt(s, `${t.trim()}
`), s
}
