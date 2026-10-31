// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: shouldKeepRouteDeliverEvent  (minified: Qht, daemon.pretty.js:91840)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function shouldKeepRouteDeliverEvent(event, sessionKeys) {
    return event.type !== "route.deliver" || !isRecord(event.payload) ? !1 : event.payload.source_event_type === zW || event.session_key !== void 0 && sessionKeys.has(event.session_key)
}
