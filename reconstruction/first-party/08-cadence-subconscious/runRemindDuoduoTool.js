// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runRemindDuoduoTool  (minified: Mg, daemon.pretty.js:64973)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 3 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): `RemindDuoduo` books one future turn of the calling session — no key, no target. For a job session it is one more fire of its own schedule. Cancel a pending one with `duoduo job archive <id>`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runRemindDuoduoTool(input, ctx) {
    try {
        let when = typeof input?.when == "string" ? input.when.trim() : "";
        if (!when) return 'Error: when is required (e.g. "@in 30m").';
        let sessionKey = ctx.sessionKey?.trim() ?? "";
        if (ctx.sessionContextKind === "job" || sessionKey.startsWith("job:")) return await Llt(when, ctx.paths, sessionKey);
        let context = typeof input?.context == "string" ? input.context.trim() : "";
        if (!context) return "Error: context is required. The woken turn receives nothing else — say what to inspect and where the current evidence lives.";
        let ownerSession = ctx.sessionKey?.trim();
        if (!ownerSession) return "Error: no calling session is bound, so there is no session to wake.";
        let jobManager = new Br(ctx.paths),
            {
                id,
                runAt
            } = await jobManager.createWakeRecord({
                ownerSession,
                when,
                context
            });
        return ["RemindDuoduo scheduled.", `- id: ${id}`, `- fires at: ${runAt}`, `- target: ${ownerSession} (this session)`, "", "It fires once, and it does not interrupt a turn already in progress.", `ManageJob(list) shows it; \`duoduo job archive ${id}\` cancels it before it fires.`].join(`
`)
    } catch (err) {
        return logErrorMessage("[Wake] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
