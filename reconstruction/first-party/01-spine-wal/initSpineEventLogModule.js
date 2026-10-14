// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: initSpineEventLogModule  (minified: Ao, daemon.pretty.js:32324)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var vae, G8e, jR, mU, wae, initSpineEventLogModule = O(() => {
    "use strict";
    Ql();
    DR();
    Tr();
    Kn();
    initLogLevelModule();
    vae = new Map;
    G8e = /^\d{4}-\d{2}-\d{2}\.jsonl$/;
    jR = new Map;
    mU = 7, wae = "ALADUO_SPINE_INDEX_RETENTION_DAYS"
});
