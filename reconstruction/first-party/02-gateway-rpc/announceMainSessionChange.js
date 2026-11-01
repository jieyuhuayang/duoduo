// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: announceMainSessionChange  (minified: wSe, daemon.pretty.js:90245)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.7 (high): The session is told when it becomes main and tells its owner in its own words.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function announceMainSessionChange(e, t, n) {
    for (let r of n) await deliverMainRoleNoticeSafely(e, r, renderFormerMainSessionNotice(t));
    await deliverMainRoleNoticeSafely(e, t, renderNewMainSessionNotice(n)), await patchSessionRuntimeState(e.paths, t, {
        main_since: new Date().toISOString()
    }).catch(r => logWarnMessage("[main-role] main_since stamp failed", {
        session_key: t,
        error: String(r)
    })), await refreshSessionIndexEntry(e.paths, e.sessionIndex, t)
}
