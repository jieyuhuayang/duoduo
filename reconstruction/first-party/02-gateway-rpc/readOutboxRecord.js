// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOutboxRecord  (minified: La, daemon.pretty.js:35964)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOutboxRecord(e, t, n) {
    let r = resolveOutboxRecordPath(e, t, n);
    try {
        let i = await xn.readFile(r, "utf8");
        return JSON.parse(i)
    } catch {
        return null
    }
}
