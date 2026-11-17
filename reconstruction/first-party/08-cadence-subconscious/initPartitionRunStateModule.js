// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initPartitionRunStateModule  (minified: eA, daemon.pretty.js:68119)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in v0.5.0 (maps/history_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var cke, Wpt, Jpt, ty, initPartitionRunStateModule = A(() => {
    "use strict";
    er();
    $r();
    cke = {
        last_started_at: null,
        last_finished_at: null,
        last_result: null,
        consecutive_failures: 0,
        backoff_until: null
    };
    Wpt = 72e5, Jpt = 144e5, ty = 222e4
});
