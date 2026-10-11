// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parsePartitionDefinition  (minified: Wct, daemon.pretty.js:66486)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.3, v0.5.10, v0.7.0, v0.7.1, v0.8.0, v0.8.4 (maps/history_daemon.json)
// locals: 16 renamed — 3 from the code at the binding (rule), 13 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): In job frontmatter the job fails, and in partition frontmatter the partition is skipped.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parsePartitionDefinition(name, dir, claudeMdPath) {
    try {
        let content = await al.readFile(claudeMdPath, "utf8"),
            parsed = (0, Ewe.default)(content, Sr),
            rawSchedule = parsed.data?.schedule ?? {},
            schedule = {
                enabled: rawSchedule.enabled ?? mH.enabled,
                cooldown_ticks: rawSchedule.cooldown_ticks ?? mH.cooldown_ticks,
                max_duration_ms: rawSchedule.max_duration_ms ?? mH.max_duration_ms
            },
            runtimeCheck = validateRunnableRuntimeValue(parsed.data?.runtime, `Partition "${name}"`),
            runtime = runtimeCheck.ok ? runtimeCheck.runtime : void 0,
            runtimeRefusal = runtimeCheck.ok ? void 0 : runtimeCheck.reason;
        runtimeRefusal && logWarnMessage(`[playlist] ${runtimeRefusal}`);
        let {
            claudeTools
        } = parseClaudeFrontmatterBlock(parsed.data ?? {}), promptMode = normalizePromptMode(parsed.data?.prompt_mode), rawModel = parsed.data?.model, model;
        typeof rawModel == "string" && rawModel.trim().length > 0 ? model = rawModel.trim() : rawModel !== void 0 && logDebugMessage(`[playlist] partition '${name}' has invalid model frontmatter; ignoring it`, {
            rawModel
        });
        let rawEffort = parsed.data?.effort,
            effort;
        return typeof rawEffort == "string" && isEffortLevel(rawEffort) ? effort = rawEffort : rawEffort !== void 0 && logDebugMessage(`[playlist] partition '${name}' has invalid effort frontmatter; ignoring it`, {
            rawEffort
        }), {
            name,
            dir,
            claudeMdPath,
            schedule,
            promptContent: parsed.content.trim(),
            runtime,
            runtimeRefusal,
            claudeTools,
            prompt_mode: promptMode,
            model,
            effort
        }
    } catch {
        return null
    }
}
