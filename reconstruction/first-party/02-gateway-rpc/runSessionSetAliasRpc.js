// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: runSessionSetAliasRpc  (minified: RSt, daemon.pretty.js:92405)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runSessionSetAliasRpc(e, t, n, r, i) {
    return setSessionAliasWithMainRole(buildMainRoleContext(e, t, n, i), r)
}
