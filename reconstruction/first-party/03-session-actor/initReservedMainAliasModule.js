// duoduo reconstruction — subsystem: 03-session-actor
// symbol: initReservedMainAliasModule  (minified: Rr, daemon.pretty.js:36996)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.10, v0.7.0, v0.8.7 (maps/history_daemon.json)
// changelog v0.8.7 (high): A channel session can no longer take `main` as its display name any other way.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var lv, jde, TI, initReservedMainAliasModule = A(() => {
    "use strict";
    lv = Zn(xs(), 1);
    ni();
    Cr();
    Xn();
    ti();
    initSessionLockAndArchivingModule();
    initLogLevelModule();
    Qr();
    jde = null;
    TI = class extends Error {
        constructor(t) {
            super(`"${Hn}" is reserved for the main session and only session.set_alias may set or clear it (session ${t}).`), this.name = "ReservedMainAliasError"
        }
    }
});
