// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initRuntimeValidationModule  (minified: Fu, daemon.pretty.js:31837)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Lm, AR, xb, hae, initRuntimeValidationModule = O(() => {
    "use strict";
    hs();
    Lm = mR, AR = hR;
    xb = class extends Error {
        constructor(t) {
            super(t), this.name = "InvalidRuntimeError"
        }
    }, hae = e => e.map(t => `"${t}"`).join(", ")
});
