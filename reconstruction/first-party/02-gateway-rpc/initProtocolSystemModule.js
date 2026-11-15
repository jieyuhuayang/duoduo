// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: initProtocolSystemModule  (minified: NU, daemon.pretty.js:32953)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.4, v0.8.7 (maps/history_daemon.json)
// changelog v0.8.4 (medium): `spine.record` appends an `external.record` event for writers outside duoduo, with optional per-source deduplication.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var pXe, mXe, hXe, gXe, Due, Hm, AR, Mue, jue, Bb, _Xe, initProtocolSystemModule = A(() => {
    "use strict";
    initProtocolEffortModule();
    nf();
    initMainSessionAliasModule();
    pXe = ["get", "set", "unset", "profile_get", "profile_set", "profile_unset", "profile_alias_set", "profile_alias_unset"], mXe = ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token", "profile_alias_tier", "profile_alias_model"], hXe = {
        profile_set: ["profile_model", "profile_max_context_tokens", "profile_base_url", "profile_auth_field", "profile_auth_token"],
        profile_unset: ["profile_model"],
        profile_alias_set: ["profile_alias_tier", "profile_alias_model"],
        profile_alias_unset: ["profile_alias_tier"]
    }, gXe = ["anthropic_auth_token", "claude_code_oauth_token"];
    Due = /^[a-z][a-z0-9-]*$/, Hm = ["cadence", "meta", "system", "runner", "route", "gateway"], AR = ["tether", "job", "subconscious", "lark"], Mue = ["date", "interval", "from", "to", "session", "kind", "after", "show"], jue = ["unfiltered", "count_only", "sessions", "json"], Bb = {
        "memory.read": ["path"],
        "spine.cat": [...Mue, ...jue, "types", "redact"],
        "spine.record": ["source", "conversation", "payload", "dedup_key"]
    };
    _Xe = {
        "memory.read": "read",
        "spine.cat": "read",
        "spine.record": "recorded"
    }
});
