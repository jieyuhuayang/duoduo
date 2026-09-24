// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventIdIndexEntry  (minified: Q9e, daemon.pretty.js:32034)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventIdIndexEntry(e, t) {
    await $e(e.eventsIndexDir);
    let n = `${stringifyJsonlRecord(t)}
`,
        r = resolveEventIdIndexPath(e);
    await oR.appendFile(r, n);
    let i = iR.get(r);
    i && await Ou(i) && i.map.set(t.event_id, t)
}
