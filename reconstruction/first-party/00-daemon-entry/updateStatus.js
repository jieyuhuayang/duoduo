// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: updateStatus  (minified: Vu, daemon.pretty.js:33022)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateStatus(e, t, n = new Date) {
    let r = await readStatus(e) ?? buildInitialStatus(e, n),
        i = t(r);
    return i.generated_at = n.toISOString(), await writeStatus(e, i), i
}
