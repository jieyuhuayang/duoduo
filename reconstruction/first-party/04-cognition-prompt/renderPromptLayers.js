// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderPromptLayers  (minified: Lde, daemon.pretty.js:49967)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPromptLayers(e, t, n, r, i) {
    let o = resolveMetaPromptText(),
        s = e?.kind_prompt?.trim() || void 0,
        a = e?.instance_prompt?.trim() || void 0,
        l = t ? `## Runtime Context

The channel through which this session receives and delivers messages, and the runtime executing it.
- session_key: ${t}
- channel_kind: ${e?.channel_kind??"unknown"}${i?`
- runtime: ${i}`:""}` : void 0,
        u;
    if (r && r.content.trim().length > 0) {
        let d = r.content.trim();
        u = l7e.test(d) ? `${Ide}

${d}

${a7e}` : `${Ide}

${d}`
    }
    let c = n ? renderJobMissionBlock(n, n.stateless === !0) : void 0;
    return [o, s, a, u, l, c].filter(Boolean).join(`

`)
}
