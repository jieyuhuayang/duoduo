// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: ensureAbsoluteWorkspaceDir  (minified: SIe, daemon.pretty.js:90703)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureAbsoluteWorkspaceDir(e) {
    if (!so.isAbsolute(e)) return null;
    let t = so.resolve(e);
    return await zs.mkdir(t, {
        recursive: !0
    }).catch(() => null), resolveExistingDirRealpath(t)
}
