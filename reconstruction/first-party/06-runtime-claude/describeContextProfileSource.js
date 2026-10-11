// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: describeContextProfileSource  (minified: aA, daemon.pretty.js:69907)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in v0.8.1 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeContextProfileSource(requirement) {
    if (!requirement) return null;
    switch (requirement.kind) {
        case "profiled-external":
            return requirement.modelOrigin ? pmt(requirement.modelOrigin) : requirement.source;
        case "unprofiled":
            return requirement.source;
        case "native-claude":
            return "native-claude";
        case "explicit-1m":
            return "explicit-1m"
    }
}
