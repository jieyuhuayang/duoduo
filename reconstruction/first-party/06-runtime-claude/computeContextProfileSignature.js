// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: computeContextProfileSignature  (minified: sS, daemon.pretty.js:65679)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeContextProfileSignature(e) {
    let t = e.requirement,
        n = t?.kind === "profiled-external" ? t : void 0,
        r = n?.auth ? mve.createHash("sha256").update(n.auth.token).digest("hex").slice(0, 16) : null,
        i = sf.flatMap(o => {
            let s = e.aliases?.[o];
            return s ? [
                [o, s]
            ] : []
        });
    return JSON.stringify([e.capToken, n?.baseUrl ?? null, n?.auth?.field ?? null, r, i])
}
