// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderDaemonRestartHint  (minified: Mde, daemon.pretty.js:59572)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderDaemonRestartHint(e, t) {
    let n = `[system] You're running under a new daemon process (started ${e}).`;
    return t ? `${n} Restart reason, given by the caller: ${t.reason} (requested ${t.requested_at}).` : n
}
