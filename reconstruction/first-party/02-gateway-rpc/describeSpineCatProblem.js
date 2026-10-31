// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: describeSpineCatProblem  (minified: xU, daemon.pretty.js:32828)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function describeSpineCatProblem(params) {
    if (!isRecord(params)) return "params must be one JSON object";
    let keyProblem = unknownKeyProblem(params, Lb["spine.cat"]);
    if (keyProblem) return keyProblem;
    if (Object.hasOwn(params, "redact") && params.redact !== "external") return '"redact" must be "external" or left out';
    for (let textKey of Rue)
        if (Object.hasOwn(params, textKey) && typeof params[textKey] != "string") return `"${textKey}" must be text`;
    for (let booleanKey of Iue)
        if (Object.hasOwn(params, booleanKey) && typeof params[booleanKey] != "boolean") return `"${booleanKey}" must be true or false`;
    return Object.hasOwn(params, "types") && !(Array.isArray(params.types) && params.types.every(type => typeof type == "string")) ? '"types" must be an array of strings, for example ["channel.message"]' : Object.hasOwn(params, "show") && !Object.hasOwn(params, "date") ? '"date" is required with "show": no partition was read. Without a day, show scans every partition and blocks the duoduo host while it runs. Re-run duoduo spine show <id> --date <yyyy-mm-dd>; the day is in the header of the spine cat output the id came from.' : null
}
