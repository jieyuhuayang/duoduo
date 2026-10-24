// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: updateStatus  (minified: Hu, daemon.pretty.js:35104)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateStatus(paths, mutate, now = new Date) {
    let current = await readStatus(paths) ?? buildInitialStatus(paths, now),
        next = mutate(current);
    return next.generated_at = now.toISOString(), await writeStatus(paths, next), next
}
