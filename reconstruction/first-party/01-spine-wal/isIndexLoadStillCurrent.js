// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: isIndexLoadStillCurrent  (minified: Uu, daemon.pretty.js:31944)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isIndexLoadStillCurrent(e) {
    let t = e.load;
    return t ? (await t.catch(() => {}), e.load === t) : !1
}
