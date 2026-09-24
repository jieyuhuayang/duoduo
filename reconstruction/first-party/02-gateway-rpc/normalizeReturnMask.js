// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: normalizeReturnMask  (minified: bJ, daemon.pretty.js:89199)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeReturnMask(e) {
    if (!e || e.length === 0) return ["final", "stream"];
    let t = [];
    for (let n of e)(n === "final" || n === "stream" || n === "stream_end" || n === "tool") && !t.includes(n) && t.push(n);
    return t.length === 0 ? ["final", "stream"] : t
}
