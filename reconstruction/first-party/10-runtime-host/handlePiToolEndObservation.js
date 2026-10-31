// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: handlePiToolEndObservation  (minified: A0e, daemon.pretty.js:74880)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Fourth peer behind the same seam as the other three: duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handlePiToolEndObservation(paths, sessionKey, toolEnd) {
    if (!toolEnd.is_error) {
        if (toolEnd.tool_name === $s) {
            let skipReason = parsePiToolResultDetails(toolEnd.result_json)?.reason;
            if (typeof skipReason != "string" || skipReason.trim().length === 0) return;
            await patchSessionRuntimeState(paths, sessionKey, {
                pending_skip_rewind: {
                    reason: skipReason.trim(),
                    skipped_at: new Date().toISOString()
                }
            });
            return
        }
        if (toolEnd.tool_name === dp) {
            let piToolResultDetails = parsePiToolResultDetails(toolEnd.result_json),
                attachmentPath = piToolResultDetails?.path;
            if (typeof attachmentPath != "string" || attachmentPath.trim().length === 0) return;
            let toolOutput = await runQueueOutboundAttachmentTool({
                path: attachmentPath,
                mime: typeof piToolResultDetails?.mime == "string" ? piToolResultDetails.mime : void 0,
                session_key: typeof piToolResultDetails?.session_key == "string" ? piToolResultDetails.session_key : void 0
            }, {
                paths,
                sessionKey
            });
            toolOutput.startsWith("Error:") && logWarnMessage("[pi] QueueOutboundAttachment refused at the daemon observation point", {
                sessionKey,
                output: toolOutput
            })
        }
    }
}
