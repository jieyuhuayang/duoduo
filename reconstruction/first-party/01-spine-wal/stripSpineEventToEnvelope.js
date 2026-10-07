// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: stripSpineEventToEnvelope  (minified: Ske, daemon.pretty.js:90359)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripSpineEventToEnvelope(e) {
    return {
        id: e.id,
        ts: e.ts,
        type: e.type,
        source: {
            kind: e.source?.kind ?? ""
        },
        ...e.session_key !== void 0 ? {
            session_key: e.session_key
        } : {}
    }
}
