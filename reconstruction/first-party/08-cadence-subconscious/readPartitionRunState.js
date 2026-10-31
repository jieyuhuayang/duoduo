// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPartitionRunState  (minified: op, daemon.pretty.js:67891)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 2 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.1 (medium): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionRunState(paths, partitionName) {
    try {
        let content = await mpt.readFile(resolvePartitionStatePath(paths, partitionName), "utf8"),
            parsed = JSON.parse(content);
        return typeof parsed.consecutive_failures != "number" ? {
            ...WSe
        } : {
            last_started_at: typeof parsed.last_started_at == "string" ? parsed.last_started_at : null,
            last_finished_at: typeof parsed.last_finished_at == "string" ? parsed.last_finished_at : null,
            last_result: gpt(parsed.last_result) ? parsed.last_result : null,
            consecutive_failures: parsed.consecutive_failures,
            backoff_until: typeof parsed.backoff_until == "string" ? parsed.backoff_until : null
        }
    } catch {
        return {
            ...WSe
        }
    }
}
