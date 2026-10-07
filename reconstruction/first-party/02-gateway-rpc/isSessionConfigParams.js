// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionConfigParams  (minified: fR, daemon.pretty.js:31588)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionConfigParams(e) {
    if (!isRecord(e) || typeof e.verb != "string" || !R8e.includes(e.verb) || e.target !== void 0 && typeof e.target != "string" || e.kind !== void 0 && typeof e.kind != "string" || e.global !== void 0 && typeof e.global != "boolean") return !1;
    let t = typeof e.target == "string" && e.target.trim().length > 0,
        n = typeof e.kind == "string" && e.kind.trim().length > 0,
        r = e.global === !0;
    if ([t, n, r].filter(Boolean).length !== 1 || e.profile_model !== void 0 && typeof e.profile_model != "string" || e.profile_max_context_tokens !== void 0 && typeof e.profile_max_context_tokens != "number" || (e.verb === "profile_set" || e.verb === "profile_unset") && (typeof e.profile_model != "string" || e.profile_model.length === 0) || e.verb === "profile_set" && typeof e.profile_max_context_tokens != "number" || (e.verb === "profile_alias_set" || e.verb === "profile_alias_unset") && (typeof e.profile_alias_tier != "string" || e.profile_alias_tier.length === 0) || e.verb === "profile_alias_set" && (typeof e.profile_alias_model != "string" || e.profile_alias_model.length === 0) || e.profile_base_url !== void 0 && typeof e.profile_base_url != "string" || e.profile_auth_token !== void 0 && typeof e.profile_auth_token != "string" || e.profile_auth_field !== void 0 && (typeof e.profile_auth_field != "string" || !P8e.includes(e.profile_auth_field)) || e.profile_auth_field !== void 0 != (e.profile_auth_token !== void 0)) return !1;
    let i = T8e[e.verb] ?? [];
    for (let o of I8e)
        if (e[o] !== void 0 && !i.includes(o)) return !1;
    return !(e.set !== void 0 && (!isRecord(e.set) || !Object.values(e.set).every(o => typeof o == "string")) || e.unset !== void 0 && (!Array.isArray(e.unset) || !e.unset.every(o => typeof o == "string")))
}
