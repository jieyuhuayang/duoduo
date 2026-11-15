// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: nyt, daemon.pretty.js:70920)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 21 renamed — 5 from the code at the binding (rule), 16 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(partitionDir, options = {}) {
    let claudeAgentsDir = va.join(partitionDir, ".claude", "agents"),
        codexAgentsDir = va.join(partitionDir, ".codex", "agents"),
        result = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        existingTomlFiles = await ryt(codexAgentsDir),
        sourceFiles;
    try {
        sourceFiles = (await mu.readdir(claudeAgentsDir, {
            withFileTypes: !0
        })).filter(entry => entry.isFile() && entry.name.endsWith(".md")).map(entry => va.join(claudeAgentsDir, entry.name))
    } catch (err) {
        if (err?.code === "ENOENT") {
            if (options.removeStale !== !1) {
                for (let stalePath of existingTomlFiles) await mu.rm(stalePath, {
                    force: !0
                }).catch(() => {}), result.removed.push(stalePath);
                await mu.rmdir(codexAgentsDir).catch(() => {})
            }
            return result
        }
        throw err
    }
    await mu.mkdir(codexAgentsDir, {
        recursive: !0
    });
    let expectedPaths = new Set;
    for (let sourcePath of sourceFiles) try {
        let content = await mu.readFile(sourcePath, "utf8"),
            agentMarkdown = parseAgentMarkdown(sourcePath, content),
            targetPath = va.join(codexAgentsDir, `${agentMarkdown.name}.toml`),
            agentToml = renderAgentToml(agentMarkdown);
        expectedPaths.add(va.resolve(targetPath));
        let existingToml = await mu.readFile(targetPath, "utf8").catch(() => {});
        if (existingToml !== void 0 && iyt(existingToml, agentToml)) {
            result.skipped.push({
                sourcePath,
                targetPath,
                agentName: agentMarkdown.name
            });
            continue
        }
        let tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
        await mu.writeFile(tmpPath, agentToml, "utf8"), await mu.rename(tmpPath, targetPath), result.generated.push({
            sourcePath,
            targetPath,
            agentName: agentMarkdown.name
        })
    } catch (err) {
        result.errors.push({
            path: sourcePath,
            reason: err instanceof Error ? err.message : String(err)
        })
    }
    if (options.removeStale !== !1)
        for (let existingPath of existingTomlFiles) expectedPaths.has(va.resolve(existingPath)) || (await mu.rm(existingPath, {
            force: !0
        }).catch(() => {}), result.removed.push(existingPath));
    return result
}
