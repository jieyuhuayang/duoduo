// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: writeFileAtomic  (minified: Dt, daemon.pretty.js:31956)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeFileAtomic(e, t, n = {}) {
    let r = cU.dirname(e);
    await MR.mkdir(r, {
        recursive: !0
    });
    let i = `.${cU.basename(e)}.${process.pid}.${Date.now()}.${M8e.randomUUID()}.tmp`,
        o = cU.join(r, i);
    try {
        await MR.writeFile(o, t, n), await MR.rename(o, e)
    } catch (s) {
        try {
            await MR.unlink(o)
        } catch {}
        throw s
    }
}
