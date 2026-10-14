// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initNotifyConsumerStalenessModule  (minified: B6, daemon.pretty.js:64763)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): Delivering into a foreground session whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set) now fails
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Ilt, Tlt, U6, eO, initNotifyConsumerStalenessModule = O(() => {
    "use strict";
    Zr();
    initOutboxStoreModule();
    XC();
    z6();
    Ilt = "delivery_cursors", Tlt = 36e5, U6 = "ALADUO_NOTIFY_UNCONSUMED_HOURS", eO = 1
});
