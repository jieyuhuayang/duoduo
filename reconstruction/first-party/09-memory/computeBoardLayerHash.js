// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: lJ, daemon.pretty.js:82353)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return GEe("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
