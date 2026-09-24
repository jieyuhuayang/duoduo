// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveEventSourceChannelId  (minified: mft, daemon.pretty.js:71917)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveEventSourceChannelId(e) {
    if (e.source.kind === "route") {
        let t = e.payload?.channel_descriptor_id;
        return typeof t == "string" ? t : ""
    }
    return e.source.channel_id ? e.source.channel_id : e.source.kind === "rpc" || e.source.kind === "ws" ? "<legacy>" : e.source.kind
}
