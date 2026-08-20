// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderPromptLayers  (minified: Aue, daemon.pretty.js:49215)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPromptLayers(e, t, n, r) {
    let i = resolveMetaPromptText(),
        o = e?.kind_prompt?.trim() || void 0,
        s = e?.instance_prompt?.trim() || void 0,
        a = t ? `## Runtime Context

The channel through which this session receives and delivers messages.
- session_key: ${t}
- channel_kind: ${e?.channel_kind??"unknown"}` : void 0,
        l;
    if (r && r.content.trim().length > 0) {
        let c = r.content.trim();
        l = k9e.test(c) ? `${kue}

${c}

${S9e}` : `${kue}

${c}`
    }
    let u = n ? renderJobMissionBlock(n, n.stateless === !0) : void 0;
    return [i, o, s, l, a, u].filter(Boolean).join(`

`)
}
