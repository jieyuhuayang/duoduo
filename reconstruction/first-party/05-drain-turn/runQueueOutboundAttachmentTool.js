// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runQueueOutboundAttachmentTool  (minified: Yg, daemon.pretty.js:73577)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runQueueOutboundAttachmentTool(e, t) {
    try {
        if (!e.path || e.path.trim().length === 0) throw new Error("path is required");
        let n = Lht(e, t.sessionKey),
            r = await Fht(t.paths, n),
            i = Kg.isAbsolute(e.path) ? Kg.resolve(e.path) : Kg.resolve(r, e.path),
            o = await Nht.stat(i);
        if (!o.isFile()) throw new Error(`path is not a file: ${i}`);
        let s = await readSessionRuntimeState(t.paths, n),
            a = jht(n),
            {
                acceptMime: u,
                maxBytes: l
            } = Bht(s?.channel_capabilities?.[a]),
            c = pEe(e.mime ?? Mht(i));
        if (u.length === 0) throw new Error(`当前 channel 不支持接收文件/图片（accept_mime 为空）。session=${n}, channel=${a}`);
        if (!u.some(d => zht(c, d))) throw new Error(`当前 channel 不支持此 MIME: ${c}。channel=${a}, accept_mime=${u.join(", ")}`);
        if (typeof l == "number" && o.size > l) throw new Error(`文件超出 channel 大小限制: ${o.size} bytes > ${l} bytes。path=${i}`);
        return await mutateSessionRuntimeState(t.paths, n, d => ({
            pending_outbound_attachments: [...(d.pending_outbound_attachments ?? []).filter(m => Kg.resolve(m.path) !== i || m.mime !== c), {
                path: i,
                mime: c,
                queued_at: new Date().toISOString(),
                queued_via: "QueueOutboundAttachment"
            }]
        })), ["Outbound attachment queued.", `- session_key: ${n}`, `- path: ${i}`, `- mime: ${c}`, `- size_bytes: ${o.size}`, `- accept_mime: ${u.join(", ")}`].join(`
`)
    } catch (n) {
        return logErrorMessage("[QueueOutboundAttachment] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
