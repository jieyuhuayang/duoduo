// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateConfigValue  (minified: _ct, daemon.pretty.js:88340)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.1 (maps/history_daemon.json)
// changelog v0.5.10 (medium): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateConfigValue(e, t) {
    switch (CHANNEL_CONFIG_KEY_TYPES[e]) {
        case "string":
            return {
                ok: !0, value: t
            };
        case "prompt_mode":
            return t === "append" || t === "override" ? {
                ok: !0,
                value: t
            } : {
                ok: !1,
                error: `${e}: expected "append" or "override", got "${t}"`
            };
        case "runtime":
            return isKnownRuntimeValue(t) ? {
                ok: !0,
                value: t
            } : {
                ok: !1,
                error: `${e}: expected ${Lm.map(r=>JSON.stringify(r)).join(", ")}, got "${t}"`
            };
        case "boolean":
            return t === "true" ? {
                ok: !0,
                value: !0
            } : t === "false" ? {
                ok: !0,
                value: !1
            } : {
                ok: !1,
                error: `${e}: expected "true" or "false", got "${t}"`
            };
        case "nonneg_number": {
            let r = t.trim();
            if (r.length === 0 || !/^\d+(\.\d+)?$/.test(r)) return {
                ok: !1,
                error: `${e}: expected a non-negative decimal number, got "${t}"`
            };
            let i = Number(r);
            return Number.isFinite(i) ? {
                ok: !0,
                value: i
            } : {
                ok: !1,
                error: `${e}: expected a non-negative decimal number, got "${t}"`
            }
        }
        case "model_id": {
            let r = t.trim();
            return r.length > 0 && !/\s/.test(r) ? {
                ok: !0,
                value: r
            } : {
                ok: !1,
                error: `${e}: expected a model id with no whitespace, got "${t}"`
            }
        }
        case "effort_level": {
            let r = t.trim();
            return isEffortLevel(r) ? {
                ok: !0,
                value: r
            } : {
                ok: !1,
                error: `${e}: expected one of ${qi.join(", ")}, got "${t}"`
            }
        }
        case "string_array":
            return {
                ok: !0, value: t.split(",").map(r => r.trim()).filter(r => r.length > 0)
            }
    }
}
