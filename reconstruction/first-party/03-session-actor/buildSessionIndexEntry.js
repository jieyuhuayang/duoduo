// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionIndexEntry  (minified: Wfe, daemon.pretty.js:38943)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.10, v0.8.1 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): `SessionIndex` is now the in-memory derived view of `var/sessions/<hash>/state.json`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionIndexEntry(sessionKey, state, meta) {
    return {
        session_key: sessionKey,
        cwd: state.cwd,
        plane: state.plane,
        permission_profile: state.permission_profile,
        created_at: state.created_at,
        last_event_id: state.last_event_id,
        last_event_at: state.last_event_at,
        last_seen_daemon_started_at: state.last_seen_daemon_started_at,
        source_channel_id: state.source_channel_id,
        last_error: state.last_error,
        context_used_tokens: state.context_used_tokens,
        last_compact_at: state.last_compact_at,
        compact_measured_floor: state.compact_stats?.post_total,
        compact_measured_at: state.compact_stats?.measured_at,
        last_served_model: state.last_served_model,
        model: state.model,
        display_name: meta?.display_name,
        kind: meta?.kind,
        owner_session: meta?.owner_session
    }
}
