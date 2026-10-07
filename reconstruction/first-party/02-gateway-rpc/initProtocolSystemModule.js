// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: initProtocolSystemModule  (minified: oU, daemon.pretty.js:31647)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var R8e, I8e, T8e, P8e, sae, Nm, pR, aae, uae, kb, C8e, initProtocolSystemModule = O(() => {
    "use strict";
    initProtocolEffortModule();
    Hd();
    R8e = ["get", "set", "unset", "profile_get", "profile_set", "profile_unset", "profile_alias_set", "profile_alias_unset"], I8e = ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token", "profile_alias_tier", "profile_alias_model"], T8e = {
        profile_set: ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token"],
        profile_unset: ["profile_model"],
        profile_alias_set: ["profile_alias_tier", "profile_alias_model"],
        profile_alias_unset: ["profile_alias_tier"]
    }, P8e = ["anthropic_auth_token", "claude_code_oauth_token"];
    sae = /^[a-z][a-z0-9-]*$/, Nm = ["cadence", "meta", "system", "runner", "route", "gateway"], pR = ["tether", "job", "subconscious", "lark"], aae = ["date", "interval", "from", "to", "session", "kind", "after", "show"], uae = ["unfiltered", "count_only", "sessions", "json"], kb = {
        "memory.read": ["path"],
        "spine.cat": [...aae, ...uae, "types", "redact"],
        "spine.record": ["source", "conversation", "payload", "dedup_key"]
    };
    C8e = {
        "memory.read": "read",
        "spine.cat": "read",
        "spine.record": "recorded"
    }
});
