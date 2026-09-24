// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexStringInputSchema  (minified: Xg, daemon.pretty.js:80045)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexStringInputSchema(e) {
    let t = {},
        n = [];
    for (let [r, i] of Object.entries(e)) {
        let o = i,
            s = o.description ?? o.unwrap?.()?.description;
        o.safeParse?.(void 0)?.success === !0 || n.push(r), t[r] = {
            type: "string",
            ...s ? {
                description: s
            } : {}
        }
    }
    return {
        type: "object",
        properties: t,
        required: n
    }
}
