// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: describeContextProfileSource  (minified: aA, daemon.pretty.js:69907)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeContextProfileSource(e) {
    if (!e) return null;
    switch (e.kind) {
        case "profiled-external":
            return e.modelOrigin ? pmt(e.modelOrigin) : e.source;
        case "unprofiled":
            return e.source;
        case "native-claude":
            return "native-claude";
        case "explicit-1m":
            return "explicit-1m"
    }
}
