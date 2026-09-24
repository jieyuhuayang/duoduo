// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: resolveDrainContextProfileOrRefuse  (minified: jSe, daemon.pretty.js:70352)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveDrainContextProfileOrRefuse(e, t, n, r) {
    try {
        return await vO(e, n)
    } catch (i) {
        let o = i instanceof Error ? i.message : String(i);
        throw await handleDrainError(e, t, {
            anchor: r.anchor,
            error: i,
            stage: "context_profile",
            userText: `[duoduo:drain-error] agent turn refused before it started: this session's model context profile could not be resolved.

${o}

Fix the offending claude.model_profiles entry — the layer named above says which file: global = kernel/config/runtime.md, kind = kernel/config/<kind>.md, instance = the channel descriptor or the job file. No prompt reached the model and no pending notification was consumed, so the next turn runs normally once the config parses.`,
            precedingRecords: r.precedingRecords,
            bus: r.bus
        }), i
    }
}
