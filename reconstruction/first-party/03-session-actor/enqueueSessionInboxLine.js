// duoduo reconstruction — subsystem: 03-session-actor
// symbol: enqueueSessionInboxLine  (minified: aa, daemon.pretty.js:33848)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.4 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueSessionInboxLine(paths, sessionKey, line, now = new Date) {
    return assertSessionNotArchiving(sessionKey), runWithSessionMutex(sessionKey, async () => {
        let sessionInboxDir = resolveSessionInboxDir(paths, sessionKey);
        await ensureDirectoryExists(sessionInboxDir);
        let fileName = `${now.toISOString().replace(/[:.]/g,"-")}_${Xue()}.pending`,
            filePath = sa.join(sessionInboxDir, fileName),
            content = `${line.trim()}
`;
        return await writeFileAtomic(filePath, content), filePath
    })
}
