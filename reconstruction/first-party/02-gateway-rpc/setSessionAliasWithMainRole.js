// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: setSessionAliasWithMainRole  (minified: SSe, daemon.pretty.js:90271)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 3 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function setSessionAliasWithMainRole(e, t) {
    let trimmed = t.session_key.trim();
    return classifySessionKeyKind(trimmed) !== "channel" ? setSessionAliasAndReindex(e, trimmed, t.display_name, !1) : bSe(async () => {
        let sessionMetaFile = await readSessionMetaFile(e.paths, trimmed);
        if (!isReservedMainAliasChange(trimmed, t.display_name, sessionMetaFile?.display_name)) return setSessionAliasAndReindex(e, trimmed, t.display_name, !1);
        if (!sessionMetaFile) return {
            ok: !1,
            reason: "not_found",
            session_key: trimmed
        };
        let mainSessionFromIndex = resolveMainSessionFromIndex(e.sessionIndex),
            o = checkMainAliasCallerAuthority(t, trimmed, mainSessionFromIndex);
        if (o) return o;
        let s = sessionMetaFile.display_name?.trim() === Hn;
        if (!(t.display_name?.trim() === Hn)) return setSessionAliasAndReindex(e, trimmed, t.display_name, !0);
        let u = Uft(mainSessionFromIndex).filter(c => c !== trimmed);
        if (u.length > 0 && t.move !== !0) {
            let c = u.join(", ");
            return {
                ok: !1,
                reason: "main_held",
                session_key: trimmed,
                error: `${c} ${u.length===1?"is":"are"} already aliased main, and there is only one main session. Nothing was changed. To make ${trimmed} the main session instead, the current main session or the owner from their own terminal runs: ` + vSe(trimmed, Hn, !0)
            }
        }
        for (let c of u) await updateSessionDisplayName(e.paths, c, null, {
            mainAuthorized: !0
        }), await refreshSessionIndexEntry(e.paths, e.sessionIndex, c);
        let l = await setSessionAliasAndReindex(e, trimmed, Hn, !0);
        return l.ok && (!s || u.length > 0) && (logInfoMessage("[main-role] main session set", {
            session_key: trimmed,
            displaced: u
        }), await announceMainSessionChange(e, trimmed, u)), l
    })
}
