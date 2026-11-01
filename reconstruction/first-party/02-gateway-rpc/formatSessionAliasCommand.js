// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: formatSessionAliasCommand  (minified: vSe, daemon.pretty.js:90192)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.7 (high): Elsewhere `duoduo session alias <key> main --move` sets or moves it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatSessionAliasCommand(e, t, n) {
    if (t === null || t.trim().length === 0) return `duoduo session alias ${e} --clear`;
    let trimmed = t.trim();
    return trimmed === Hn ? `duoduo session alias ${e} ${Hn}${n?" --move":""}` : `duoduo session alias ${e} ${JSON.stringify(trimmed)}`
}
