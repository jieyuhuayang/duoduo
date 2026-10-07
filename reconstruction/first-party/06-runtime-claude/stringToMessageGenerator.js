// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: stringToMessageGenerator  (minified: eC, daemon.pretty.js:55502)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* stringToMessageGenerator(e) {
    yield {
        type: "user",
        message: {
            role: "user",
            content: e
        }
    }
}
