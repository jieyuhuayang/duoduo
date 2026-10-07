// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: updateDeliveryCursorFile  (minified: Dbe, daemon.pretty.js:64398)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateDeliveryCursorFile(e, t, n, r) {
    let i = resolveDeliveryCursorPath(e, t, n);
    return runWithSessionMutex(t, async () => {
        if (isSessionArchived(e, t)) return logDebugMessage("[delivery-cursor] skip cursor write: session archived (tombstoned)", {
            sessionKey: t
        }), !1;
        let o = r(await readDeliveryCursorFile(e, t, n));
        return o ? (await ensureDirectoryExists(Nbe.dirname(i)), await writeJsonFileAtomic(i, o), !0) : !1
    })
}
