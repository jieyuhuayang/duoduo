// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: initProtocolSystemModule  (minified: oU, daemon.pretty.js:31647)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var P8e, $8e, C8e, O8e, aae, Am, pR, uae, lae, kb, N8e, initProtocolSystemModule = O(() => {
    "use strict";
    initProtocolEffortModule();
    Vd();
    P8e = ["get", "set", "unset", "profile_get", "profile_set", "profile_unset", "profile_alias_set", "profile_alias_unset"], $8e = ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token", "profile_alias_tier", "profile_alias_model"], C8e = {
        profile_set: ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token"],
        profile_unset: ["profile_model"],
        profile_alias_set: ["profile_alias_tier", "profile_alias_model"],
        profile_alias_unset: ["profile_alias_tier"]
    }, O8e = ["anthropic_auth_token", "claude_code_oauth_token"];
    aae = /^[a-z][a-z0-9-]*$/, Am = ["cadence", "meta", "system", "runner", "route", "gateway"], pR = ["tether", "job", "subconscious", "lark"], uae = ["date", "interval", "from", "to", "session", "kind", "after", "show"], lae = ["unfiltered", "count_only", "sessions", "json"], kb = {
        "memory.read": ["path"],
        "spine.cat": [...uae, ...lae, "types", "redact"],
        "spine.record": ["source", "conversation", "payload", "dedup_key"]
    };
    N8e = {
        "memory.read": "read",
        "spine.cat": "read",
        "spine.record": "recorded"
    }
});
