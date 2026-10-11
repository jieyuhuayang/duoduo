// duoduo reconstruction — subsystem: 03-session-actor
// symbol: collectInstructionsInputs  (minified: qRe, daemon.pretty.js:82851)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.1 — first release whose bundle holds this declaration; body changed in v0.5.2, v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 13 renamed — 0 from the code at the binding (rule), 13 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (high): The per-session sticky-mission guard now fingerprints identity + kind prompt + instance prompt + memory board + mission, not just the mission.
// changelog v0.5.2 (medium): injects the rendered import graph into both Claude and Codex sessions through one path.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function collectInstructionsInputs(paths, sessionKey, actorOrigin, job) {
    let identity = resolveMetaPromptText() ?? void 0,
        memoryBoard;
    try {
        memoryBoard = (await transcludeBroadcastBoard(paths.memoryBroadcastPath)).rendered.trim() || void 0
    } catch {
        memoryBoard = void 0
    }
    let kindPrompt, instancePrompt;
    if (actorOrigin.origin === "channel") {
        let sourceChannelId = (await readSessionRuntimeState(paths, sessionKey))?.source_channel_id;
        if (sourceChannelId) {
            let channelDescriptor = await readChannelDescriptor(paths, sourceChannelId).catch(() => null);
            if (channelDescriptor?.channel_kind) {
                let channelConfig = await resolveEffectiveChannelConfig(paths, {
                    channel_kind: channelDescriptor.channel_kind,
                    channel_id: sourceChannelId
                }).catch(() => null);
                kindPrompt = channelConfig?.kind_prompt?.trim() || void 0, instancePrompt = channelConfig?.instance_prompt?.trim() || void 0
            }
        }
    }
    let mission, missionAcceptance;
    return actorOrigin.origin === "job" && actorOrigin.jobId && job && (mission = job.content, missionAcceptance = job.frontmatter.acceptance?.trim()), {
        instructions: {
            identity,
            kindPrompt,
            instancePrompt,
            memoryBoard,
            mission,
            missionAcceptance
        },
        missionContent: mission
    }
}
