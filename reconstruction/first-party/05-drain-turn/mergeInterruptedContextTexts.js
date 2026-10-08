// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: mergeInterruptedContextTexts  (minified: zmt, daemon.pretty.js:72072)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeInterruptedContextTexts(e, t) {
    let n = new Map;
    for (let i of Uxe(t)) n.set(Txe(i), i);
    let r = e.trim();
    return r && n.set(Txe(r), r), Array.from(n.values()).join($W)
}
