// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runRemindDuoduoTool  (minified: mg, daemon.pretty.js:64294)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runRemindDuoduoTool(e, t) {
    try {
        let n = typeof e?.when == "string" ? e.when.trim() : "";
        if (!n) return 'Error: when is required (e.g. "@in 30m").';
        let r = t.sessionKey?.trim() ?? "";
        if (t.sessionContextKind === "job" || r.startsWith("job:")) return await Aat(n, t.paths, r);
        let i = typeof e?.context == "string" ? e.context.trim() : "";
        if (!i) return "Error: context is required. The woken turn receives nothing else — say what to inspect and where the current evidence lives.";
        let o = t.sessionKey?.trim();
        if (!o) return "Error: no calling session is bound, so there is no session to wake.";
        let s = new Ur(t.paths),
            {
                id: a,
                runAt: u
            } = await s.createWakeRecord({
                ownerSession: o,
                when: n,
                context: i
            });
        return ["RemindDuoduo scheduled.", `- id: ${a}`, `- fires at: ${u}`, `- target: ${o} (this session)`, "", "It fires once, and it does not interrupt a turn already in progress.", `ManageJob(list) shows it; \`duoduo job archive ${a}\` cancels it before it fires.`].join(`
`)
    } catch (n) {
        return Le("[Wake] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
