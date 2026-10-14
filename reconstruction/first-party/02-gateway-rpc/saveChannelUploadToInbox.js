// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: saveChannelUploadToInbox  (minified: Sve, daemon.pretty.js:88276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 12 renamed — 0 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function saveChannelUploadToInbox(paths, sessionKey, fileName, mime, contentBase64, options = {}) {
    let safeName = sanitizeUploadFileName(fileName),
        inboxDir = Zf.join(paths.workDir, "inbox", safeName);
    await ensureDirectoryExists(inboxDir);
    let content = Buffer.from(contentBase64, "base64"),
        digest = cct.createHash("sha256").update(content).digest("hex"),
        ext = Zf.extname(safeName),
        filePath = Zf.join(inboxDir, `${digest}${ext}`);
    return await writeFileAtomic(filePath, content), await pct({
        dir: inboxDir,
        safeName,
        digest,
        ext,
        mime,
        sessionKey,
        receivedVia: options.receivedVia,
        sourceName: options.sourceName,
        uploadedAt: options.uploadedAt ?? new Date
    }), {
        path: filePath,
        mime,
        name: safeName
    }
}
