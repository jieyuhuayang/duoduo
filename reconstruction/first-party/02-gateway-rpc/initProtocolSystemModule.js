// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: initProtocolSystemModule  (minified: RU, daemon.pretty.js:32843)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.4, v0.8.7 (maps/history_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var U7e, q7e, B7e, V7e, Eue, qm, PR, Rue, Iue, Lb, W7e, initProtocolSystemModule = A(() => {
    "use strict";
    initProtocolEffortModule();
    ef();
    initMainSessionAliasModule();
    U7e = ["get", "set", "unset", "profile_get", "profile_set", "profile_unset", "profile_alias_set", "profile_alias_unset"], q7e = ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token", "profile_alias_tier", "profile_alias_model"], B7e = {
        profile_set: ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token"],
        profile_unset: ["profile_model"],
        profile_alias_set: ["profile_alias_tier", "profile_alias_model"],
        profile_alias_unset: ["profile_alias_tier"]
    }, V7e = ["anthropic_auth_token", "claude_code_oauth_token"];
    Eue = /^[a-z][a-z0-9-]*$/, qm = ["cadence", "meta", "system", "runner", "route", "gateway"], PR = ["tether", "job", "subconscious", "lark"], Rue = ["date", "interval", "from", "to", "session", "kind", "after", "show"], Iue = ["unfiltered", "count_only", "sessions", "json"], Lb = {
        "memory.read": ["path"],
        "spine.cat": [...Rue, ...Iue, "types", "redact"],
        "spine.record": ["source", "conversation", "payload", "dedup_key"]
    };
    W7e = {
        "memory.read": "read",
        "spine.cat": "read",
        "spine.record": "recorded"
    }
});
