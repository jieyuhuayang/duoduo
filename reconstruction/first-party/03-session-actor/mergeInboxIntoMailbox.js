// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mergeInboxIntoMailbox  (minified: HR, daemon.pretty.js:32661)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.1, v0.5.4, v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 20 renamed — 8 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeInboxIntoMailbox(paths, sessionKey) {
    let sessionInboxDir = resolveSessionInboxDir(paths, sessionKey),
        pendingFiles;
    try {
        pendingFiles = (await listPendingInboxFiles(sessionInboxDir)).sort()
    } catch (err) {
        throw new VR(err)
    }
    if (pendingFiles.length === 0) return await ensureSessionMailboxPendingDir(paths, sessionKey), {
        merged: 0
    };
    let sessionMailboxPendingDir = await ensureSessionMailboxPendingDir(paths, sessionKey),
        merged = 0;
    for (let fileName of pendingFiles) {
        let filePath = ea.join(sessionInboxDir, fileName),
            raw;
        try {
            raw = await wr.readFile(filePath, "utf8")
        } catch (err) {
            let code = err.code,
                quarantine = Pae(code);
            if (!quarantine && code === "ENOENT") try {
                quarantine = (await wr.lstat(filePath)).isSymbolicLink()
            } catch (err) {
                quarantine = err.code !== "ENOENT"
            }
            if (!quarantine) {
                if (code === "ENOENT") continue;
                throw err
            }
            logErrorMessage(`[mailbox] unprocessable inbox item — quarantining: ${filePath}`, err);
            try {
                await moveFileIntoDirectory(filePath, ea.join(sessionInboxDir, "quarantine"))
            } catch (err) {
                logErrorMessage(`[mailbox] failed to quarantine inbox item — skipped for this merge: ${filePath}`, err)
            }
            continue
        }
        let trimmed = raw.trim();
        if (trimmed.length === 0) {
            await wr.unlink(filePath);
            continue
        }
        let eventId = Dae(trimmed) ?? void 0,
            replySessionKey = Mae(trimmed) ?? void 0,
            itemFileName = `${fileName.replace(/\.pending$/,"")}.item.json`,
            item = {
                line: trimmed,
                event_id: eventId,
                reply_session_key: replySessionKey,
                created_at: aYe(fileName) ?? new Date().toISOString()
            };
        await writeFileAtomic(ea.join(sessionMailboxPendingDir, itemFileName), JSON.stringify(item) + `
`), await wr.unlink(filePath), merged += 1
    }
    return {
        merged
    }
}
