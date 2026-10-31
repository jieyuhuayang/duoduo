// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveEventSourceChannelId  (minified: yyt, daemon.pretty.js:73439)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveEventSourceChannelId(event) {
    if (event.source.kind === "route") {
        let descriptorId = event.payload?.channel_descriptor_id;
        return typeof descriptorId == "string" ? descriptorId : ""
    }
    return event.source.channel_id ? event.source.channel_id : event.source.kind === "rpc" || event.source.kind === "ws" ? "<legacy>" : event.source.kind
}
