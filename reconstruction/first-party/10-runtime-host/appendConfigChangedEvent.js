// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendConfigChangedEvent  (minified: ky, daemon.pretty.js:91842)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// changelog v0.5.10 (medium): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendConfigChangedEvent(e, t) {
    try {
        let n = createSpineEvent({
            type: "config.changed",
            source: {
                kind: "rpc",
                name: "session.config"
            },
            ...t.scope === "instance" ? {
                session_key: t.sessionKey
            } : {},
            payload: t.scope === "instance" ? {
                scope: "instance",
                session_key: t.sessionKey,
                channel_id: t.channelId,
                changed: t.changed
            } : t.scope === "kind" ? {
                scope: "kind",
                kind: t.kind,
                changed: t.changed
            } : {
                scope: "global",
                file: `${Yr}.md`,
                changed: t.changed
            }
        });
        return await atomicAppendEvent(e, n), n.id
    } catch {
        return
    }
}
