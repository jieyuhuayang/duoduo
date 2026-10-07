// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeSpineRecordProblem  (minified: iU, daemon.pretty.js:31644)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeSpineRecordProblem(e) {
    return isRecord(e) ? unknownKeyProblem(e, kb["spine.record"]) ?? textKeysProblem(e, ["source", "conversation"], ["dedup_key"]) ?? (sae.test(e.source) ? null : `"source" must be lowercase letters, digits and '-', starting with a letter`) ?? describeConversationProblem("conversation", e.conversation) ?? (isRecord(e.payload) ? null : '"payload" must be one JSON object') : "params must be one JSON object"
}
