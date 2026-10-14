// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: retirePartitionOnce  (minified: Ypt, daemon.pretty.js:69456)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 15 renamed — 6 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): The `memory-weaver` subconscious partition is **replaced** by two partitions. Existing partition prompts are never overwritten by an upgrade, so nothing changes until you refresh them
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function retirePartitionOnce(paths, partition) {
    let {
        name,
        selfId
    } = partition, skipped = reason => ({
        partition: name,
        action: "skipped",
        reason
    }), partitionContract = readPartitionContract(paths.subconsciousDir, name);
    if (partitionContract.state === "partition-absent") return skipped("absent");
    if (partitionContract.state === "parse-fail") return logWarnMessage(`[init] partition '${name}': charter frontmatter is unreadable, not retiring it.`), skipped("unreadable");
    if (!(selfId === "contract" ? partitionContract.state === "valid" : partitionContract.state === "no-contract")) return logInfoMessage(`[init] partition '${name}' is retired upstream but no longer declares itself the official '${name}' (contract: ${partitionContract.state}) — left untouched.`), skipped("not-self-identified");
    let markerPath = zke.join(paths.partitionStateDir, `${name}${Kpt}`);
    if (await Xpt(markerPath)) return partitionContract.enabled && logInfoMessage(`[init] partition '${name}' was retired on this host but is enabled again — leaving it alone (the retirement runs once).`), skipped("already-retired");
    let claudeMdPath = zke.join(paths.subconsciousDir, name, "CLAUDE.md"),
        content = await Uke.readFile(claudeMdPath, "utf8"),
        parsed = (0, gW.default)(content, Sr),
        data = parsed.data;
    if (data == null || typeof data != "object" || Array.isArray(data)) return logWarnMessage(`[init] partition '${name}': frontmatter is not a map, not retiring.`), skipped("unreadable");
    let frontmatter = data,
        schedule = frontmatter.schedule;
    if (typeof schedule != "object" || schedule === null || Array.isArray(schedule) || schedule.enabled !== !0) return skipped("not-enabled");
    await ensureDirectoryExists(paths.partitionStateDir), await writeFileAtomic(markerPath, `${JSON.stringify({version:Qpt(),retired_at:new Date().toISOString()})}
`);
    let nextFrontmatter = {
        ...frontmatter,
        schedule: {
            ...schedule,
            enabled: !1
        }
    };
    return await writeFileAtomic(claudeMdPath, gW.default.stringify(parsed.content, nextFrontmatter)), logInfoMessage(`[init] retired partition '${name}': bootstrap no longer ships it, so schedule.enabled was flipped to false once (marker ${markerPath}). Set it back by hand to keep running it.`), {
        partition: name,
        action: "retired",
        reason: "flipped"
    }
}
