// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: classifyModelContextRequirement  (minified: uH, daemon.pretty.js:69703)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyModelContextRequirement({
    model: e,
    mergedCatalog: t,
    hostMaxContextTokens: n
}) {
    if (!e) return aSe(null, n);
    if (e.startsWith(Fz)) return {
        kind: "native-claude",
        model: e,
        requiredMaxContextTokens: void 0
    };
    if (e.endsWith(Nm)) {
        let r = aH(e);
        return Object.hasOwn(t, r) ? sSe(e, t[r]) : {
            kind: "explicit-1m",
            model: e,
            requiredMaxContextTokens: void 0
        }
    }
    return Object.hasOwn(t, e) ? sSe(e, t[e]) : aSe(e, n)
}
