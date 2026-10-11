// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: buildInitialStatus  (minified: wU, daemon.pretty.js:32984)
// name: INFERRED — upstream's own spelling, from the __export block of v0.2.0..v0.3.7, followed to this release by the release pairing (maps/historical_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildInitialStatus(e, t = new Date, n = {}) {
    return {
        generated_at: t.toISOString(),
        kernel: {
            root: e.kernelDir,
            version: n.kernelVersion ?? "unknown"
        },
        workspaces: [{
            root: e.workDir,
            active_sessions: 0
        }],
        cadence: {
            mode: "layered",
            last_tick: null
        },
        spine: {
            event_log: Lae.join(e.eventsDir, `${t.toISOString().slice(0,10)}.jsonl`)
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
