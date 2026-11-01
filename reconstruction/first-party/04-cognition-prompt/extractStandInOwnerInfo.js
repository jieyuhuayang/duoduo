// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: extractStandInOwnerInfo  (minified: aJ, daemon.pretty.js:72957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractStandInOwnerInfo(e) {
    if ("stand_in_for_owner" in e) return {
        owner: readStringProperty(e, "stand_in_for_owner")
    }
}
