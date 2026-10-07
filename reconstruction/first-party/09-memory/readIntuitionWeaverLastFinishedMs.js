// duoduo reconstruction — subsystem: 09-memory
// symbol: readIntuitionWeaverLastFinishedMs  (minified: kSe, daemon.pretty.js:68414)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readIntuitionWeaverLastFinishedMs(e) {
    let t = await readPartitionRunState(e, SSe),
        n = t.last_finished_at === null ? NaN : Date.parse(t.last_finished_at);
    return Number.isFinite(n) ? n : 0
}
