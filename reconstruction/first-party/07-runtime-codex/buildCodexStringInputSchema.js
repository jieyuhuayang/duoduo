// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexStringInputSchema  (minified: vy, daemon.pretty.js:80347)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// changelog v0.4.4 (medium): Dynamic tools bridge: aladuo MCP tools available to Codex sessions
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
