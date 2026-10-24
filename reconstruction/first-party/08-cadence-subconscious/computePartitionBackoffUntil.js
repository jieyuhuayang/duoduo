// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computePartitionBackoffUntil  (minified: Q6, daemon.pretty.js:68806)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computePartitionBackoffUntil(result, consecutiveFailures, now, cadenceIntervalMs) {
    if (result === "success" || result === "invalid_output") return null;
    let baseMs = cadenceIntervalMs ?? Zg;
    if (result === "timeout") {
        if (consecutiveFailures <= 2) return null;
        let delayMs = Math.min(consecutiveFailures * baseMs, Zmt);
        return new Date(now.getTime() + delayMs).toISOString()
    }
    if (consecutiveFailures <= 1) return null;
    let delayMs = Math.min(consecutiveFailures * 2 * baseMs, Kmt);
    return new Date(now.getTime() + delayMs).toISOString()
}
