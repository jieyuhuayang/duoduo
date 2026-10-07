// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isMimePattern  (minified: N8e, daemon.pretty.js:31720)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMimePattern(e) {
    return e.length === 0 ? !1 : e === "*/*" ? !0 : !!/^([a-z0-9][a-z0-9!#$&^_.+-]*)\/([a-z0-9][a-z0-9!#$&^_.+-]*|\*)$/i.exec(e)
}
