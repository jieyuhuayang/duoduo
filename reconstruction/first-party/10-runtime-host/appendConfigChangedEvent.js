// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendConfigChangedEvent  (minified: ky, daemon.pretty.js:91888)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (medium): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendConfigChangedEvent(paths, change) {
    try {
        let spineEvent = createSpineEvent({
            type: "config.changed",
            source: {
                kind: "rpc",
                name: "session.config"
            },
            ...change.scope === "instance" ? {
                session_key: change.sessionKey
            } : {},
            payload: change.scope === "instance" ? {
                scope: "instance",
                session_key: change.sessionKey,
                channel_id: change.channelId,
                changed: change.changed
            } : change.scope === "kind" ? {
                scope: "kind",
                kind: change.kind,
                changed: change.changed
            } : {
                scope: "global",
                file: `${Yr}.md`,
                changed: change.changed
            }
        });
        return await atomicAppendEvent(paths, spineEvent), spineEvent.id
    } catch {
        return
    }
}
