// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parsePositiveMsEnv  (minified: fB, daemon.pretty.js:55196)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parsePositiveMsEnv(e, t) {
    if (e === void 0) return t;
    let n = Number(e);
    return Number.isInteger(n) && n >= 1 && n <= xrt ? n : t
}
