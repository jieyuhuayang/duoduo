// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: redactSpineEventForExternal  (minified: Npt, daemon.pretty.js:90373)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function redactSpineEventForExternal(e, t = new Set) {
    if (e.type === kke) return e;
    if (e.session_key === void 0 || classifySessionKeyKind(e.session_key) !== "channel") return null;
    if (Opt.has(e.type) || shouldKeepRouteDeliverEvent(e, t)) return e;
    if (e.type === "agent.tool_use" || e.type === "agent.tool_result") {
        let n = isRecord(e.payload) ? e.payload : {};
        return {
            ...stripSpineEventToEnvelope(e),
            payload: {
                ...typeof n.tool_name == "string" ? {
                    tool_name: n.tool_name
                } : {},
                ...typeof n.is_error == "boolean" ? {
                    is_error: n.is_error
                } : {}
            }
        }
    }
    return stripSpineEventToEnvelope(e)
}
