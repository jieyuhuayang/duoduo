// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runQueueOutboundAttachmentTool  (minified: Yg, daemon.pretty.js:73577)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.3, v0.8.0 (maps/history_daemon.json)
// locals: 15 renamed — 5 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runQueueOutboundAttachmentTool(input, ctx) {
    try {
        if (!input.path || input.path.trim().length === 0) throw new Error("path is required");
        let sessionKey = Lht(input, ctx.sessionKey),
            baseDir = await Fht(ctx.paths, sessionKey),
            resolvedPath = Kg.isAbsolute(input.path) ? Kg.resolve(input.path) : Kg.resolve(baseDir, input.path),
            stats = await Nht.stat(resolvedPath);
        if (!stats.isFile()) throw new Error(`path is not a file: ${resolvedPath}`);
        let sessionRuntimeState = await readSessionRuntimeState(ctx.paths, sessionKey),
            channelId = jht(sessionKey),
            {
                acceptMime,
                maxBytes
            } = Bht(sessionRuntimeState?.channel_capabilities?.[channelId]),
            mime = pEe(input.mime ?? Mht(resolvedPath));
        if (acceptMime.length === 0) throw new Error(`当前 channel 不支持接收文件/图片（accept_mime 为空）。session=${sessionKey}, channel=${channelId}`);
        if (!acceptMime.some(pattern => zht(mime, pattern))) throw new Error(`当前 channel 不支持此 MIME: ${mime}。channel=${channelId}, accept_mime=${acceptMime.join(", ")}`);
        if (typeof maxBytes == "number" && stats.size > maxBytes) throw new Error(`文件超出 channel 大小限制: ${stats.size} bytes > ${maxBytes} bytes。path=${resolvedPath}`);
        return await mutateSessionRuntimeState(ctx.paths, sessionKey, state => ({
            pending_outbound_attachments: [...(state.pending_outbound_attachments ?? []).filter(attachment => Kg.resolve(attachment.path) !== resolvedPath || attachment.mime !== mime), {
                path: resolvedPath,
                mime,
                queued_at: new Date().toISOString(),
                queued_via: "QueueOutboundAttachment"
            }]
        })), ["Outbound attachment queued.", `- session_key: ${sessionKey}`, `- path: ${resolvedPath}`, `- mime: ${mime}`, `- size_bytes: ${stats.size}`, `- accept_mime: ${acceptMime.join(", ")}`].join(`
`)
    } catch (err) {
        return logErrorMessage("[QueueOutboundAttachment] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
