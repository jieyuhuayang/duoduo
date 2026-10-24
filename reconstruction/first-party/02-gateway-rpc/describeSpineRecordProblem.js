// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeSpineRecordProblem  (minified: LU, daemon.pretty.js:33726)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeSpineRecordProblem(params) {
    return isRecord(params) ? unknownKeyProblem(params, Db["spine.record"]) ?? textKeysProblem(params, ["source", "conversation"], ["dedup_key"]) ?? (Que.test(params.source) ? null : `"source" must be lowercase letters, digits and '-', starting with a letter`) ?? describeConversationProblem("conversation", params.conversation) ?? (isRecord(params.payload) ? null : '"payload" must be one JSON object') : "params must be one JSON object"
}
