// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: appendConfigChangedEvent  (minified: ty, daemon.pretty.js:90314)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
                file: `${Jr}.md`,
                changed: t.changed
            }
        });
        return await atomicAppendEvent(e, n), n.id
    } catch {
        return
    }
}
