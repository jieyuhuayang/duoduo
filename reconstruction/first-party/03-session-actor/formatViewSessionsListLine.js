// duoduo reconstruction — subsystem: 03-session-actor
// symbol: formatViewSessionsListLine  (minified: g_e, daemon.pretty.js:64225)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatViewSessionsListLine(e) {
    let t = [`kind ${e.kind}`];
    return e.display_name && t.push(`alias "${e.display_name}"`), e.orphan && t.push("orphan — job archived or recreated, will not run"), `- ${e.session_key} (${t.join("; ")})${e.isCaller?" (you)":""}`
}
