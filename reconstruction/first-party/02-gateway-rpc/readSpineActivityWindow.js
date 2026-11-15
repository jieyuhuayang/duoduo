// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readSpineActivityWindow  (minified: ske, daemon.pretty.js:91142)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSpineActivityWindow(e, t, n = new Date) {
    let r = n.getTime() - jpt[t],
        date = new Date(r),
        o = n.toISOString().slice(0, 10),
        s = date.toISOString().slice(0, 10),
        a = [];
    return !await tke(e, `${o}.jsonl`, r, a) && s !== o && await tke(e, `${s}.jsonl`, r, a), {
        from: date.toISOString(),
        to: n.toISOString(),
        events: a.reverse()
    }
}
