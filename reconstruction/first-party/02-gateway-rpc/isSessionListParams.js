// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionListParams  (minified: wR, daemon.pretty.js:33642)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session list [--kind …] [--named] [--all] [--json]` — the live route table of every session the daemon knows.
// changelog v0.8.4 (high): `session.list` accepts `deliverable: true` to list only the sessions a `Notify` would deliver to.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionListParams(params) {
    return params == null ? !0 : !(!isRecord(params) || params.kind !== void 0 && !isSessionListKind(params.kind) || params.named_only !== void 0 && typeof params.named_only != "boolean" || params.include_orphans !== void 0 && typeof params.include_orphans != "boolean" || params.deliverable !== void 0 && typeof params.deliverable != "boolean")
}
