// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordOutboxSentId  (minified: Bm, daemon.pretty.js:36117)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordOutboxSentId(e, t) {
    let n = await gle(e);
    n.has(t) || (await $e(e.outboxDir), await xn.appendFile(resolveOutboxSentIdsPath(e), `${t}
`), n.add(t))
}
