// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: buildInitialStatus  (minified: wU, daemon.pretty.js:32984)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildInitialStatus(paths, now = new Date, options = {}) {
    return {
        generated_at: now.toISOString(),
        kernel: {
            root: paths.kernelDir,
            version: options.kernelVersion ?? "unknown"
        },
        workspaces: [{
            root: paths.workDir,
            active_sessions: 0
        }],
        cadence: {
            mode: "layered",
            last_tick: null
        },
        spine: {
            event_log: Lae.join(paths.eventsDir, `${now.toISOString().slice(0,10)}.jsonl`)
        },
        health: {
            gateway: "starting",
            meta_session: "starting"
        },
        limits: {
            context_budget_tokens: 18e3
        }
    }
}
