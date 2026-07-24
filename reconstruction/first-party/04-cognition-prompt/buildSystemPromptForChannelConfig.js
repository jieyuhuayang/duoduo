// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildSystemPromptForChannelConfig  (minified: ZE, daemon.pretty.js:48232)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSystemPromptForChannelConfig(e, t, n, r) {
    let i = resolveMetaPromptText(),
        s = e?.kind_prompt?.trim() || void 0,
        o = e?.instance_prompt?.trim() || void 0,
        a = t ? `## Runtime Context

The channel through which this session receives and delivers messages.
- session_key: ${t}
- channel_kind: ${e?.channel_kind??"unknown"}` : void 0,
        u;
    if (r && r.content.trim().length > 0) {
        let d = r.content.trim();
        u = jWe.test(d) ? `${Hoe}

${d}

${DWe}` : `${Hoe}

${d}`
    }
    let c = n ? renderJobMissionBlock(n, n.stateless === !0) : void 0;
    if (e?.prompt_mode === "override") return [i, s, o, u, a, c].filter(Boolean).join(`

`) || "";
    let l = [i, s, o, u, a, c].filter(Boolean).join(`

`).trim() || void 0;
    return l ? {
        type: "preset",
        preset: "claude_code",
        append: l
    } : void 0
}
