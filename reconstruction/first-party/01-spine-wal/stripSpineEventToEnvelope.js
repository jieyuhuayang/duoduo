// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: stripSpineEventToEnvelope  (minified: zxe, daemon.pretty.js:91844)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripSpineEventToEnvelope(event) {
    return {
        id: event.id,
        ts: event.ts,
        type: event.type,
        source: {
            kind: event.source?.kind ?? ""
        },
        ...event.session_key !== void 0 ? {
            session_key: event.session_key
        } : {}
    }
}
