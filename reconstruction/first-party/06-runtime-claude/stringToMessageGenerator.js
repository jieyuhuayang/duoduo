// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: stringToMessageGenerator  (minified: _C, daemon.pretty.js:55186)
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
