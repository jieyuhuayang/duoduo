// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeSpineCatProblem  (minified: rU, daemon.pretty.js:31632)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (high): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeSpineCatProblem(e) {
    if (!isRecord(e)) return "params must be one JSON object";
    let t = unknownKeyProblem(e, kb["spine.cat"]);
    if (t) return t;
    if (Object.hasOwn(e, "redact") && e.redact !== "external") return '"redact" must be "external" or left out';
    for (let n of aae)
        if (Object.hasOwn(e, n) && typeof e[n] != "string") return `"${n}" must be text`;
    for (let n of uae)
        if (Object.hasOwn(e, n) && typeof e[n] != "boolean") return `"${n}" must be true or false`;
    return Object.hasOwn(e, "types") && !(Array.isArray(e.types) && e.types.every(n => typeof n == "string")) ? '"types" must be an array of strings, for example ["channel.message"]' : Object.hasOwn(e, "show") && !Object.hasOwn(e, "date") ? '"date" is required with "show": no partition was read. Without a day, show scans every partition and blocks the duoduo host while it runs. Re-run duoduo spine show <id> --date <yyyy-mm-dd>; the day is in the header of the spine cat output the id came from.' : null
}
