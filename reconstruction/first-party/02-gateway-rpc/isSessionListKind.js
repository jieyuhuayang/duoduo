// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionListKind  (minified: wU, daemon.pretty.js:32752)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session list [--kind …] [--named] [--all] [--json]`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionListKind(kind) {
    return kind === "channel" || kind === "job" || kind === "meta" || kind === "subconscious" || kind === "system"
}
