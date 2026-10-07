// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseScheduleDurationMs  (minified: jw, daemon.pretty.js:61308)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseScheduleDurationMs(e) {
    let t = /(\d+)([smhdw])/g,
        n = 0,
        r = 0,
        i;
    for (;
        (i = t.exec(e)) !== null;) r += i[0].length, n += parseInt(i[1], 10) * out(i[2]);
    if (r === 0 || r !== e.length) throw new Error(`Invalid duration format: ${e}`);
    return n
}
