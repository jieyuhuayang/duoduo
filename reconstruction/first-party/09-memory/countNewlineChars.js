// duoduo reconstruction — subsystem: 09-memory
// symbol: countNewlineChars  (minified: AO, daemon.pretty.js:66807)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function countNewlineChars(e) {
    let t = 0;
    for (let n = 0; n < e.length; n++) e[n] === `
` && t++;
    return t
}
