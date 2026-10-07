// duoduo reconstruction — subsystem: 03-session-actor
// symbol: initSessionLockAndArchivingModule  (minified: Fa, daemon.pretty.js:32541)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Ab, UR, qm, initSessionLockAndArchivingModule = O(() => {
    "use strict";
    Ab = new Set, UR = new Map;
    qm = class extends Error {
        kind = "session_archiving";
        sessionKey;
        constructor(t) {
            super(`Session is being archived; refusing to materialize state. Retry after session.archive completes. session_key=${t}`), this.name = "SessionArchivingError", this.sessionKey = t
        }
    }
});
