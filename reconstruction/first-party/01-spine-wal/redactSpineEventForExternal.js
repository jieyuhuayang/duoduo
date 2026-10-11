// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: redactSpineEventForExternal  (minified: Npt, daemon.pretty.js:90373)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function redactSpineEventForExternal(event, sessionKeys = new Set) {
    if (event.type === kke) return event;
    if (event.session_key === void 0 || classifySessionKeyKind(event.session_key) !== "channel") return null;
    if (Opt.has(event.type) || shouldKeepRouteDeliverEvent(event, sessionKeys)) return event;
    if (event.type === "agent.tool_use" || event.type === "agent.tool_result") {
        let payload = isRecord(event.payload) ? event.payload : {};
        return {
            ...stripSpineEventToEnvelope(event),
            payload: {
                ...typeof payload.tool_name == "string" ? {
                    tool_name: payload.tool_name
                } : {},
                ...typeof payload.is_error == "boolean" ? {
                    is_error: payload.is_error
                } : {}
            }
        }
    }
    return stripSpineEventToEnvelope(event)
}
