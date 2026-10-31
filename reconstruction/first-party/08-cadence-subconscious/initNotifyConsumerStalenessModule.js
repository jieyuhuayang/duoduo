// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initNotifyConsumerStalenessModule  (minified: p6, daemon.pretty.js:66033)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): Delivering into a foreground session whose last consumer take is older than `ALADUO_NOTIFY_UNCONSUMED_HOURS` (default off until set) now fails
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var qdt, Bdt, d6, _O, initNotifyConsumerStalenessModule = A(() => {
    "use strict";
    ti();
    initOutboxStoreModule();
    gO();
    c6();
    qdt = "delivery_cursors", Bdt = 36e5, d6 = "ALADUO_NOTIFY_UNCONSUMED_HOURS", _O = 1
});
