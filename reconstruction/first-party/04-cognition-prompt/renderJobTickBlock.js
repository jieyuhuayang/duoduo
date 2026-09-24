// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderJobTickBlock  (minified: nft, daemon.pretty.js:71654)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobTickBlock(e) {
    let t = r => {
            let i = kO(r);
            return i ? `${r} (daemon: ${i})` : r
        },
        n = ["<job-tick>", "Scheduled trigger for this run.", `- run_number: ${e.run_number}`, `- triggered_at: ${t(e.triggered_at)}`];
    if (e.previous_run_at) {
        let r = Date.parse(e.triggered_at) - Date.parse(e.previous_run_at);
        Number.isFinite(r) && r > 0 ? n.push(`- previous_run_at: ${t(e.previous_run_at)} (${XSe(r)} ago)`) : n.push(`- previous_run_at: ${t(e.previous_run_at)}`)
    } else n.push("- previous_run_at: (first run)");
    return n.push(`- cron: ${e.cron}`), n.push("</job-tick>"), n.join(`
`)
}
