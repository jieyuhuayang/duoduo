// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveExistingDirRealpath  (minified: dp, daemon.pretty.js:90693)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveExistingDirRealpath(e) {
    if (!so.isAbsolute(e)) return null;
    let t = so.resolve(e),
        n = await zs.realpath(t).catch(() => null);
    if (!n) return null;
    let r = await zs.stat(n).catch(() => null);
    return !r || !r.isDirectory() ? null : (await zs.access(n).catch(() => {
        throw new Error("inaccessible")
    }), n)
}
