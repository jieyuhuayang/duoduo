// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventIdIndexEntry  (minified: J8e, daemon.pretty.js:32137)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventIdIndexEntry(e, t) {
    await Ne(e.eventsIndexDir);
    let n = `${stringifyJsonlRecord(t)}
`,
        r = resolveEventIdIndexPath(e);
    await LR.appendFile(r, n);
    let i = jR.get(r);
    i && await Uu(i) && i.map.set(t.event_id, t)
}
