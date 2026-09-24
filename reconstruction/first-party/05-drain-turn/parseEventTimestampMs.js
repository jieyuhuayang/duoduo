// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: parseEventTimestampMs  (minified: zSe, daemon.pretty.js:71856)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseEventTimestampMs(e) {
    if (!e) return null;
    let t = Date.parse(e);
    return Number.isFinite(t) ? t : null
}
