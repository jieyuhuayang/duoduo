// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parsePartitionDefinition  (minified: Xut, daemon.pretty.js:66214)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parsePartitionDefinition(e, t, n) {
    try {
        let r = await Gu.readFile(n, "utf8"),
            i = (0, sve.default)(r, _r),
            o = i.data?.schedule ?? {},
            s = {
                enabled: o.enabled ?? h6.enabled,
                cooldown_ticks: o.cooldown_ticks ?? h6.cooldown_ticks,
                max_duration_ms: o.max_duration_ms ?? h6.max_duration_ms
            },
            a = i.data?.runtime,
            u;
        isSupportedRuntime(a) ? u = a : a !== void 0 && Re(`[playlist] partition '${e}' has invalid runtime frontmatter; falling back to global default`, {
            rawRuntime: a
        });
        let {
            claudeTools: l
        } = parseClaudeFrontmatterBlock(i.data ?? {}), c = normalizePromptMode(i.data?.prompt_mode), d = i.data?.model, f;
        typeof d == "string" && d.trim().length > 0 ? f = d.trim() : d !== void 0 && Re(`[playlist] partition '${e}' has invalid model frontmatter; ignoring it`, {
            rawModel: d
        });
        let p = i.data?.effort,
            m;
        return typeof p == "string" && isEffortLevel(p) ? m = p : p !== void 0 && Re(`[playlist] partition '${e}' has invalid effort frontmatter; ignoring it`, {
            rawEffort: p
        }), {
            name: e,
            dir: t,
            claudeMdPath: n,
            schedule: s,
            promptContent: i.content.trim(),
            runtime: u,
            claudeTools: l,
            prompt_mode: c,
            model: f,
            effort: m
        }
    } catch {
        return null
    }
}
