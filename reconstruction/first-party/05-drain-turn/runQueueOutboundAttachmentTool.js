// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runQueueOutboundAttachmentTool  (minified: sy, daemon.pretty.js:75660)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.3, v0.8.0 (maps/history_daemon.json)
// locals: 15 renamed — 5 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runQueueOutboundAttachmentTool(input, ctx) {
    try {
        if (!input.path || input.path.trim().length === 0) throw new Error("path is required");
        let sessionKey = Mbt(input, ctx.sessionKey),
            baseDir = await jbt(ctx.paths, sessionKey),
            resolvedPath = oy.isAbsolute(input.path) ? oy.resolve(input.path) : oy.resolve(baseDir, input.path),
            stats = await Obt.stat(resolvedPath);
        if (!stats.isFile()) throw new Error(`path is not a file: ${resolvedPath}`);
        let sessionRuntimeState = await readSessionRuntimeState(ctx.paths, sessionKey),
            channelId = Dbt(sessionKey),
            {
                acceptMime,
                maxBytes
            } = Ubt(sessionRuntimeState?.channel_capabilities?.[channelId]),
            mime = uRe(input.mime ?? Nbt(resolvedPath));
        if (acceptMime.length === 0) throw new Error(`当前 channel 不支持接收文件/图片（accept_mime 为空）。session=${sessionKey}, channel=${channelId}`);
        if (!acceptMime.some(pattern => Lbt(mime, pattern))) throw new Error(`当前 channel 不支持此 MIME: ${mime}。channel=${channelId}, accept_mime=${acceptMime.join(", ")}`);
        if (typeof maxBytes == "number" && stats.size > maxBytes) throw new Error(`文件超出 channel 大小限制: ${stats.size} bytes > ${maxBytes} bytes。path=${resolvedPath}`);
        return await mutateSessionRuntimeState(ctx.paths, sessionKey, state => ({
            pending_outbound_attachments: [...(state.pending_outbound_attachments ?? []).filter(attachment => oy.resolve(attachment.path) !== resolvedPath || attachment.mime !== mime), {
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
