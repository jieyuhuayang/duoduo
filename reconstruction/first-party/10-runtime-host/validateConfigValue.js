// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: validateConfigValue  (minified: gmt, daemon.pretty.js:90468)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (medium): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function validateConfigValue(key, rawValue) {
    switch (CHANNEL_CONFIG_KEY_TYPES[key]) {
        case "string":
            return {
                ok: !0, value: rawValue
            };
        case "prompt_mode":
            return rawValue === "append" || rawValue === "override" ? {
                ok: !0,
                value: rawValue
            } : {
                ok: !1,
                error: `${key}: expected "append" or "override", got "${rawValue}"`
            };
        case "runtime":
            return isKnownRuntimeValue(rawValue) ? {
                ok: !0,
                value: rawValue
            } : {
                ok: !1,
                error: `${key}: expected ${Wm.map(runtime=>JSON.stringify(runtime)).join(", ")}, got "${rawValue}"`
            };
        case "boolean":
            return rawValue === "true" ? {
                ok: !0,
                value: !0
            } : rawValue === "false" ? {
                ok: !0,
                value: !1
            } : {
                ok: !1,
                error: `${key}: expected "true" or "false", got "${rawValue}"`
            };
        case "nonneg_number": {
            let trimmed = rawValue.trim();
            if (trimmed.length === 0 || !/^\d+(\.\d+)?$/.test(trimmed)) return {
                ok: !1,
                error: `${key}: expected a non-negative decimal number, got "${rawValue}"`
            };
            let numberValue = Number(trimmed);
            return Number.isFinite(numberValue) ? {
                ok: !0,
                value: numberValue
            } : {
                ok: !1,
                error: `${key}: expected a non-negative decimal number, got "${rawValue}"`
            }
        }
        case "model_id": {
            let trimmed = rawValue.trim();
            return trimmed.length > 0 && !/\s/.test(trimmed) ? {
                ok: !0,
                value: trimmed
            } : {
                ok: !1,
                error: `${key}: expected a model id with no whitespace, got "${rawValue}"`
            }
        }
        case "effort_level": {
            let trimmed = rawValue.trim();
            return isEffortLevel(trimmed) ? {
                ok: !0,
                value: trimmed
            } : {
                ok: !1,
                error: `${key}: expected one of ${Hi.join(", ")}, got "${rawValue}"`
            }
        }
        case "string_array":
            return {
                ok: !0, value: rawValue.split(",").map(item => item.trim()).filter(item => item.length > 0)
            }
    }
}
