// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: handlePiToolEndObservation  (minified: Eke, daemon.pretty.js:73355)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handlePiToolEndObservation(e, t, n) {
    if (!n.is_error) {
        if (n.tool_name === ws) {
            let r = parsePiToolResultDetails(n.result_json)?.reason;
            if (typeof r != "string" || r.trim().length === 0) return;
            await patchSessionRuntimeState(e, t, {
                pending_skip_rewind: {
                    reason: r.trim(),
                    skipped_at: new Date().toISOString()
                }
            });
            return
        }
        if (n.tool_name === qf) {
            let r = parsePiToolResultDetails(n.result_json),
                i = r?.path;
            if (typeof i != "string" || i.trim().length === 0) return;
            let o = await Pg({
                path: i,
                mime: typeof r?.mime == "string" ? r.mime : void 0,
                session_key: typeof r?.session_key == "string" ? r.session_key : void 0
            }, {
                paths: e,
                sessionKey: t
            });
            o.startsWith("Error:") && Z("[pi] QueueOutboundAttachment refused at the daemon observation point", {
                sessionKey: t,
                output: o
            })
        }
    }
}
