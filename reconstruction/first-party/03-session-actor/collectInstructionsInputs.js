// duoduo reconstruction — subsystem: 03-session-actor
// symbol: collectInstructionsInputs  (minified: XEe, daemon.pretty.js:82549)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function collectInstructionsInputs(e, t, n, r) {
    let i = resolveMetaPromptText() ?? void 0,
        o;
    try {
        o = (await transcludeBroadcastBoard(e.memoryBroadcastPath)).rendered.trim() || void 0
    } catch {
        o = void 0
    }
    let s, a;
    if (n.origin === "channel") {
        let d = (await ct(e, t))?.source_channel_id;
        if (d) {
            let f = await ho(e, d).catch(() => null);
            if (f?.channel_kind) {
                let p = await Za(e, {
                    channel_kind: f.channel_kind,
                    channel_id: d
                }).catch(() => null);
                s = p?.kind_prompt?.trim() || void 0, a = p?.instance_prompt?.trim() || void 0
            }
        }
    }
    let u, l;
    return n.origin === "job" && n.jobId && r && (u = r.content, l = r.frontmatter.acceptance?.trim()), {
        instructions: {
            identity: i,
            kindPrompt: s,
            instancePrompt: a,
            memoryBoard: o,
            mission: u,
            missionAcceptance: l
        },
        missionContent: u
    }
}
