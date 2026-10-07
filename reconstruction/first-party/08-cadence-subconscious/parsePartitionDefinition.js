// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parsePartitionDefinition  (minified: Wct, daemon.pretty.js:66486)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parsePartitionDefinition(e, t, n) {
    try {
        let r = await al.readFile(n, "utf8"),
            i = (0, Ewe.default)(r, Sr),
            o = i.data?.schedule ?? {},
            s = {
                enabled: o.enabled ?? mH.enabled,
                cooldown_ticks: o.cooldown_ticks ?? mH.cooldown_ticks,
                max_duration_ms: o.max_duration_ms ?? mH.max_duration_ms
            },
            a = validateRunnableRuntimeValue(i.data?.runtime, `Partition "${e}"`),
            u = a.ok ? a.runtime : void 0,
            l = a.ok ? void 0 : a.reason;
        l && Z(`[playlist] ${l}`);
        let {
            claudeTools: c
        } = parseClaudeFrontmatterBlock(i.data ?? {}), d = normalizePromptMode(i.data?.prompt_mode), f = i.data?.model, p;
        typeof f == "string" && f.trim().length > 0 ? p = f.trim() : f !== void 0 && ke(`[playlist] partition '${e}' has invalid model frontmatter; ignoring it`, {
            rawModel: f
        });
        let m = i.data?.effort,
            h;
        return typeof m == "string" && isEffortLevel(m) ? h = m : m !== void 0 && ke(`[playlist] partition '${e}' has invalid effort frontmatter; ignoring it`, {
            rawEffort: m
        }), {
            name: e,
            dir: t,
            claudeMdPath: n,
            schedule: s,
            promptContent: i.content.trim(),
            runtime: u,
            runtimeRefusal: l,
            claudeTools: c,
            prompt_mode: d,
            model: p,
            effort: h
        }
    } catch {
        return null
    }
}
