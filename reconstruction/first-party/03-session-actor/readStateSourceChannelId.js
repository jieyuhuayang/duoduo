// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readStateSourceChannelId  (minified: dwe, daemon.pretty.js:66295)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 2 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): partial-archive retries now resolve the owning channel from the freshest archived state.json
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readStateSourceChannelId(statePath) {
    try {
        let content = await Ai.readFile(statePath, "utf8"),
            parsed = JSON.parse(content);
        if (typeof parsed.source_channel_id == "string" && parsed.source_channel_id.length > 0) return parsed.source_channel_id
    } catch {}
}
