// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: realpathOrSelf  (minified: ygt, daemon.pretty.js:82246)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function realpathOrSelf(e) {
    try {
        return await BEe.realpath(e)
    } catch {
        return e
    }
}
