// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: realpathOrSelf  (minified: ebt, daemon.pretty.js:82548)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function realpathOrSelf(e) {
    try {
        return await ARe.realpath(e)
    } catch {
        return e
    }
}
