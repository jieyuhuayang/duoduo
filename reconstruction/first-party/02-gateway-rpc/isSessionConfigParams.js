// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionConfigParams  (minified: fR, daemon.pretty.js:31588)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 8 renamed — 0 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionConfigParams(params) {
    if (!isRecord(params) || typeof params.verb != "string" || !R8e.includes(params.verb) || params.target !== void 0 && typeof params.target != "string" || params.kind !== void 0 && typeof params.kind != "string" || params.global !== void 0 && typeof params.global != "boolean") return !1;
    let hasTarget = typeof params.target == "string" && params.target.trim().length > 0,
        hasKind = typeof params.kind == "string" && params.kind.trim().length > 0,
        isGlobal = params.global === !0;
    if ([hasTarget, hasKind, isGlobal].filter(Boolean).length !== 1 || params.profile_model !== void 0 && typeof params.profile_model != "string" || params.profile_max_context_tokens !== void 0 && typeof params.profile_max_context_tokens != "number" || (params.verb === "profile_set" || params.verb === "profile_unset") && (typeof params.profile_model != "string" || params.profile_model.length === 0) || params.verb === "profile_set" && typeof params.profile_max_context_tokens != "number" || (params.verb === "profile_alias_set" || params.verb === "profile_alias_unset") && (typeof params.profile_alias_tier != "string" || params.profile_alias_tier.length === 0) || params.verb === "profile_alias_set" && (typeof params.profile_alias_model != "string" || params.profile_alias_model.length === 0) || params.profile_base_url !== void 0 && typeof params.profile_base_url != "string" || params.profile_auth_token !== void 0 && typeof params.profile_auth_token != "string" || params.profile_auth_field !== void 0 && (typeof params.profile_auth_field != "string" || !P8e.includes(params.profile_auth_field)) || params.profile_auth_field !== void 0 != (params.profile_auth_token !== void 0)) return !1;
    let allowedProfileKeys = T8e[params.verb] ?? [];
    for (let profileKey of I8e)
        if (params[profileKey] !== void 0 && !allowedProfileKeys.includes(profileKey)) return !1;
    return !(params.set !== void 0 && (!isRecord(params.set) || !Object.values(params.set).every(value => typeof value == "string")) || params.unset !== void 0 && (!Array.isArray(params.unset) || !params.unset.every(key => typeof key == "string")))
}
