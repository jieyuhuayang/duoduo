// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: initSpineEventLogModule  (minified: jo, daemon.pretty.js:33522)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Lue, sXe, QR, DU, Fue, initSpineEventLogModule = A(() => {
    "use strict";
    ic();
    YR();
    Cr();
    Xn();
    initLogLevelModule();
    Lue = new Map;
    sXe = /^\d{4}-\d{2}-\d{2}\.jsonl$/;
    QR = new Map;
    DU = 7, Fue = "ALADUO_SPINE_INDEX_RETENTION_DAYS"
});
