// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parseInputJsonDelta  (minified: Z$, daemon.pretty.js:55130)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseInputJsonDelta(e) {
    if (!e || typeof e != "object" || e.type !== "content_block_delta") return null;
    let n = e.index;
    if (typeof n != "number") return null;
    let r = e.delta;
    if (!r || typeof r != "object" || r.type !== "input_json_delta") return null;
    let o = r.partial_json;
    return typeof o != "string" ? null : {
        index: n,
        partialJson: o
    }
}
