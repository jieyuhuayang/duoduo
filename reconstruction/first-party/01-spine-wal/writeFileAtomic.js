// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: writeFileAtomic  (minified: Dt, daemon.pretty.js:34038)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 1 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeFileAtomic(filePath, data, options = {}) {
    let dir = HU.dirname(filePath);
    await XR.mkdir(dir, {
        recursive: !0
    });
    let tempName = `.${HU.basename(filePath)}.${process.pid}.${Date.now()}.${DQe.randomUUID()}.tmp`,
        tempPath = HU.join(dir, tempName);
    try {
        await XR.writeFile(tempPath, data, options), await XR.rename(tempPath, filePath)
    } catch (err) {
        try {
            await XR.unlink(tempPath)
        } catch {}
        throw err
    }
}
