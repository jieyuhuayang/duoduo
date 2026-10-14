// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: scheduleSessionWakeRecord  (minified: lvt, daemon.pretty.js:91023)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 12 renamed — 8 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): `duoduo session wake` refuses the kernel plane rather than accepting a target it cannot reach
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scheduleSessionWakeRecord(paths, sessionIndex, params) {
    let trimmed = params.session_key.trim(),
        sessionByKeyOrAlias = resolveSessionByKeyOrAlias(sessionIndex, trimmed);
    if (!sessionByKeyOrAlias.ok) return {
        ok: !1,
        reason: "not_found",
        session_key: trimmed,
        error: sessionByKeyOrAlias.reason === "ambiguous" ? `'${trimmed}' matches more than one session — pass a full session_key.` : `No such session: ${trimmed}`
    };
    let isolatedPlaneKind = resolveIsolatedPlaneKind(sessionByKeyOrAlias.session_key);
    if (isolatedPlaneKind) return {
        ok: !1,
        reason: "forbidden_kind",
        session_key: sessionByKeyOrAlias.session_key,
        kind: isolatedPlaneKind,
        error: `Only channel and job sessions can be woken — ${sessionByKeyOrAlias.session_key} is a ${isolatedPlaneKind} session, and the ${isolatedPlaneKind} plane is isolated.`
    };
    if (await isVoidRuntimeSession(paths, sessionByKeyOrAlias.session_key)) return {
        ok: !1,
        reason: "void_session",
        session_key: sessionByKeyOrAlias.session_key,
        error: `${Ju} A wake would start no turn; nothing was scheduled.`
    };
    let date = new Date;
    try {
        parseJobRearmTime(params.when, date)
    } catch (err) {
        return {
            ok: !1,
            reason: "invalid_when",
            session_key: sessionByKeyOrAlias.session_key,
            error: err instanceof Error ? err.message : String(err)
        }
    }
    try {
        let wakeStore = new Br(paths),
            {
                id,
                runAt
            } = await wakeStore.createWakeRecord({
                ownerSession: sessionByKeyOrAlias.session_key,
                when: params.when,
                context: params.context,
                now: date
            });
        return {
            ok: !0,
            session_key: sessionByKeyOrAlias.session_key,
            wake_id: id,
            run_at: runAt
        }
    } catch (err) {
        return {
            ok: !1,
            reason: "failed",
            session_key: sessionByKeyOrAlias.session_key,
            error: err instanceof Error ? err.message : String(err)
        }
    }
}
