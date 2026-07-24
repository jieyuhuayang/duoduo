// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parsePositiveMsEnv  (minified: Az, daemon.pretty.js:48331)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePositiveMsEnv(e, t) {
    if (e === void 0) return t;
    let n = Number(e);
    return Number.isInteger(n) && n >= 1 && n <= HWe ? n : t
}
