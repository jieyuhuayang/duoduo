// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parsePositiveMsEnv  (minified: bU, daemon.pretty.js:49317)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePositiveMsEnv(e, t) {
    if (e === void 0) return t;
    let n = Number(e);
    return Number.isInteger(n) && n >= 1 && n <= O9e ? n : t
}
