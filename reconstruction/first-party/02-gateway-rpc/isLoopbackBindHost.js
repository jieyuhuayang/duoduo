// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isLoopbackBindHost  (minified: VSt, daemon.pretty.js:93514)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token. A misconfigured remote setup — a public address with no token, or a port colliding with the read-only one — refuses to start rather than exposing anything.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLoopbackBindHost(host) {
    let hostname = gK(host.trim().toLowerCase());
    if (hostname === "localhost" || hostname === "::1") return !0;
    let ipv4Match = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
    return !!(ipv4Match && ipv4Match.slice(1).every(octet => Number(octet) <= 255))
}
