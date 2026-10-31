// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initRuntimeValidationModule  (minified: zu, daemon.pretty.js:33035)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): After the upgrade an unknown value in `ALADUO_DEFAULT_RUNTIME` stops the daemon from booting (an absent or empty value still means `claude`).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Wm, KR, Fb, Nue, initRuntimeValidationModule = A(() => {
    "use strict";
    Qr();
    Wm = $R, KR = CR;
    Fb = class extends Error {
        constructor(message) {
            super(message), this.name = "InvalidRuntimeError"
        }
    }, Nue = values => values.map(value => `"${value}"`).join(", ")
});
