// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveContextCapToken  (minified: np, daemon.pretty.js:69897)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveContextCapToken(e) {
    let t = fmt(e.hostMaxContextTokens),
        n = e.requirement;
    return n?.kind === "profiled-external" ? String(n.requiredMaxContextTokens) : n?.kind === "native-claude" || n?.kind === "explicit-1m" ? e.liveGenerationToken === void 0 ? t : e.liveGenerationToken : t
}
