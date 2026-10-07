// duoduo reconstruction — subsystem: 03-session-actor
// symbol: initSessionLockAndArchivingModule  (minified: Fa, daemon.pretty.js:32541)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): Concurrent `channel.ack` during archive refused at entry: prevents delivery-cursor writers from creating files beside a just-renamed session dir; observer re-read is now wrapped in the per-session state lock and re-checks the archiving marker after the lock is taken.
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
