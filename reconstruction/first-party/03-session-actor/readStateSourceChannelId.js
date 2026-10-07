// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readStateSourceChannelId  (minified: dwe, daemon.pretty.js:66295)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): partial-archive retries now resolve the owning channel from the freshest archived state.json
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readStateSourceChannelId(e) {
    try {
        let t = await Ai.readFile(e, "utf8"),
            n = JSON.parse(t);
        if (typeof n.source_channel_id == "string" && n.source_channel_id.length > 0) return n.source_channel_id
    } catch {}
}
