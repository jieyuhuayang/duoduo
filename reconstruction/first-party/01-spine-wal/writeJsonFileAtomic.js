// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: writeJsonFileAtomic  (minified: Bt, daemon.pretty.js:31972)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeJsonFileAtomic(e, t, n = {}) {
    let r = n.space ?? 2,
        i = `${JSON.stringify(t,null,r)}
`;
    await writeFileAtomic(e, i)
}
