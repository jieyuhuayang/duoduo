// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runQueueOutboundAttachmentTool  (minified: Pg, daemon.pretty.js:73275)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runQueueOutboundAttachmentTool(e, t) {
    try {
        if (!e.path || e.path.trim().length === 0) throw new Error("path is required");
        let n = tpt(e, t.sessionKey),
            r = await npt(t.paths, n),
            i = Tg.isAbsolute(e.path) ? Tg.resolve(e.path) : Tg.resolve(r, e.path),
            o = await Yft.stat(i);
        if (!o.isFile()) throw new Error(`path is not a file: ${i}`);
        let s = await ct(t.paths, n),
            a = ept(n),
            {
                acceptMime: u,
                maxBytes: l
            } = spt(s?.channel_capabilities?.[a]),
            c = kke(e.mime ?? Qft(i));
        if (u.length === 0) throw new Error(`当前 channel 不支持接收文件/图片（accept_mime 为空）。session=${n}, channel=${a}`);
        if (!u.some(d => rpt(c, d))) throw new Error(`当前 channel 不支持此 MIME: ${c}。channel=${a}, accept_mime=${u.join(", ")}`);
        if (typeof l == "number" && o.size > l) throw new Error(`文件超出 channel 大小限制: ${o.size} bytes > ${l} bytes。path=${i}`);
        return await mutateSessionRuntimeState(t.paths, n, d => ({
            pending_outbound_attachments: [...(d.pending_outbound_attachments ?? []).filter(m => Tg.resolve(m.path) !== i || m.mime !== c), {
                path: i,
                mime: c,
                queued_at: new Date().toISOString(),
                queued_via: "QueueOutboundAttachment"
            }]
        })), ["Outbound attachment queued.", `- session_key: ${n}`, `- path: ${i}`, `- mime: ${c}`, `- size_bytes: ${o.size}`, `- accept_mime: ${u.join(", ")}`].join(`
`)
    } catch (n) {
        return Le("[QueueOutboundAttachment] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
