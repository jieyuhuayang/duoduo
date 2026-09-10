// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: classifyModelContextRequirement  (minified: IB, daemon.pretty.js:63845)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyModelContextRequirement({
    model: e,
    mergedCatalog: t,
    hostMaxContextTokens: n
}) {
    if (!e) return i_e(null, n);
    if (e.startsWith(OL)) return {
        kind: "native-claude",
        model: e,
        requiredMaxContextTokens: void 0
    };
    if (e.endsWith(rm)) {
        let r = TB(e);
        return Object.hasOwn(t, r) ? r_e(e, t[r]) : {
            kind: "explicit-1m",
            model: e,
            requiredMaxContextTokens: void 0
        }
    }
    return Object.hasOwn(t, e) ? r_e(e, t[e]) : i_e(e, n)
}
