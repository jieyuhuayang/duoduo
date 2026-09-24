// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPartitionRunState  (minified: jf, daemon.pretty.js:66420)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionRunState(e, t) {
    try {
        let n = await elt.readFile(cve(e, t), "utf8"),
            r = JSON.parse(n);
        return typeof r.consecutive_failures != "number" ? {
            ...lve
        } : {
            last_started_at: typeof r.last_started_at == "string" ? r.last_started_at : null,
            last_finished_at: typeof r.last_finished_at == "string" ? r.last_finished_at : null,
            last_result: nlt(r.last_result) ? r.last_result : null,
            consecutive_failures: r.consecutive_failures,
            backoff_until: typeof r.backoff_until == "string" ? r.backoff_until : null
        }
    } catch {
        return {
            ...lve
        }
    }
}
