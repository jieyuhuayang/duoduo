// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionIndexEntry  (minified: m_e, daemon.pretty.js:64094)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionIndexEntry(e, t, n) {
    return {
        session_key: e,
        cwd: t.cwd,
        plane: t.plane,
        permission_profile: t.permission_profile,
        created_at: t.created_at,
        last_event_id: t.last_event_id,
        last_event_at: t.last_event_at,
        last_seen_daemon_started_at: t.last_seen_daemon_started_at,
        source_channel_id: t.source_channel_id,
        last_error: t.last_error,
        context_used_tokens: t.context_used_tokens,
        last_compact_at: t.last_compact_at,
        compact_measured_floor: t.compact_stats?.post_total,
        compact_measured_at: t.compact_stats?.measured_at,
        last_served_model: t.last_served_model,
        model: t.model,
        display_name: n?.display_name,
        kind: n?.kind,
        owner_session: n?.owner_session
    }
}
