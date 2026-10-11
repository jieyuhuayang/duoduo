// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveExistingDirRealpath  (minified: dp, daemon.pretty.js:90693)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveExistingDirRealpath(dirPath) {
    if (!so.isAbsolute(dirPath)) return null;
    let resolvedPath = so.resolve(dirPath),
        realPath = await zs.realpath(resolvedPath).catch(() => null);
    if (!realPath) return null;
    let stats = await zs.stat(realPath).catch(() => null);
    return !stats || !stats.isDirectory() ? null : (await zs.access(realPath).catch(() => {
        throw new Error("inaccessible")
    }), realPath)
}
