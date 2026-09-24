// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: updateDeliveryCursorFile  (minified: v_e, daemon.pretty.js:64495)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateDeliveryCursorFile(e, t, n, r) {
    let i = S_e(e, t, n);
    return runWithSessionMutex(t, async () => {
        if (isSessionArchived(e, t)) return Re("[delivery-cursor] skip cursor write: session archived (tombstoned)", {
            sessionKey: t
        }), !1;
        let o = r(await readDeliveryCursorFile(e, t, n));
        return o ? (await $e(b_e.dirname(i)), await Bt(i, o), !0) : !1
    })
}
