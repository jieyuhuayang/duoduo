// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveNotifyTargetSessionKey  (minified: mft, daemon.pretty.js:66732)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.0, v0.5.0, v0.6.2, v0.8.7 (maps/history_daemon.json)
// locals: 26 renamed — 2 from the code at the binding (rule), 24 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.6.2 (medium): The `Notify` tool accepts display-name aliases ... Archived sessions are excluded from alias resolution
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveNotifyTargetSessionKey(paths, targetSessionKey, resolveMain) {
    let target = targetSessionKey?.trim(),
        allSessionStateFiles = await readAllSessionStateFiles(paths),
        keys = Object.keys(allSessionStateFiles);
    if (!target) {
        let activity = await g6(paths, keys),
            displayNames = await y6(paths, keys, activity),
            groups = groupNotifyTargetCandidates(void 0, allSessionStateFiles, displayNames, activity);
        throw new Error(["target_session_key is required in this session.", "The target must be a foreground working session.", ...renderNotifyTargetCandidateLines(groups)].join(`
`))
    }
    if (target in allSessionStateFiles) return target;
    if (target === Hn) {
        let mainResolution = resolveMain();
        if (mainResolution.state === "held") return mainResolution.session_key;
        if (mainResolution.state === "ambiguous") throw new Error([`Ambiguous target alias: ${mainResolution.candidates.length} sessions are aliased main, so none is the main session.`, "Retry with the full session_key of the one you mean:", ...mainResolution.candidates.map(candidateKey => `- ${candidateKey}`)].join(`
`));
        let mainActivity = await g6(paths, keys),
            mainDisplayNames = await y6(paths, keys, mainActivity),
            mainGroups = groupNotifyTargetCandidates(target, allSessionStateFiles, mainDisplayNames, mainActivity);
        throw new Error(["There is no main session right now, so `main` reaches nobody.", "Name the session you mean instead (prefer active foreground sessions).", ...renderNotifyTargetCandidateLines(mainGroups)].join(`
`))
    }
    let aliasActivity = await g6(paths, keys),
        displayNames = await y6(paths, keys, aliasActivity),
        aliasMatches = [...displayNames.entries()].filter(([, displayName]) => displayName === target).map(([sessionKey]) => sessionKey);
    if (aliasMatches.length === 1) return aliasMatches[0];
    if (aliasMatches.length > 1) {
        let ranked = aliasMatches.map(sessionKey => {
            let state = allSessionStateFiles[sessionKey];
            return {
                sessionKey,
                lastEventAt: state?.last_event_at,
                sortKey: state?.last_event_at ?? state?.updated_at ?? ""
            }
        }).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
        throw new Error([`Ambiguous target alias: ${aliasMatches.length} sessions share the display name "${target}".`, "Retry with the full session_key of the one you mean (most recent activity first):", ...ranked.map(item => item.lastEventAt ? `- ${item.sessionKey} (last activity ${item.lastEventAt})` : `- ${item.sessionKey} (never drained; session state written ${item.sortKey||"unknown"})`)].join(`
`))
    }
    let groups = groupNotifyTargetCandidates(target, allSessionStateFiles, displayNames, aliasActivity);
    throw new Error([`Target session not found: ${target}`, "The target must be a persisted session key or a session display-name alias (prefer active foreground sessions).", ...renderNotifyTargetCandidateLines(groups)].join(`
`))
}
