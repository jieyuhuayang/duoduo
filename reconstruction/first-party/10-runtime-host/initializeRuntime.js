// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: dmt, daemon.pretty.js:69835)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.5, v0.3.0, v0.3.1, v0.4.3, v0.5.0, v0.5.1, v0.5.3, v0.6.0, v0.7.0, v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(paths, env = process.env) {
    await archiveLegacyRegistrySessionsDir(paths);
    let requiredDirs = [paths.runtimeDir, paths.varDir, paths.runDir, paths.eventsDir, paths.eventsIndexDir, paths.registryDir, paths.outboxDir, paths.sessionsDir, paths.jobsDir, paths.varIngressDir, paths.telemetryDir, paths.usageDir, paths.cadenceDir, paths.runLocksDir, paths.runQueueOffsetsDir, paths.kernelDir, paths.workDir];
    for (let dir of requiredDirs) await ensureDirectoryExists(dir);
    await or.chmod(paths.runDir, 448), await migrateLegacyJobSessionKeys(paths), await copyBootstrapIntoKernel(paths, env), await refreshBootstrapDuoduoMdFiles(paths), await ensureDirectoryExists(paths.memoryDir), await ensureDirectoryExists(paths.memoryEntitiesDir), await ensureDirectoryExists(paths.memoryTopicsDir), await ensureDirectoryExists(paths.memoryFragmentsDir), await ensureDirectoryExists(paths.memoryStateDir), await ensureDirectoryExists(paths.subconsciousDir), await ensureDirectoryExists(paths.subconsciousVarDir), await ensureDirectoryExists(paths.partitionStateDir), await ensureDirectoryExists(sr.join(paths.kernelDir, ".claude")), await fU(paths.subconsciousPlaylistPath, omt), await fU(paths.memoryBroadcastPath, smt), await retireListedPartitions(paths), await ensureKernelGitRepo(paths.kernelDir), await generateAllPartitionCodexAgents(paths);
    let statusFilePath = statusPath(paths);
    return await pathExistsAsync(statusFilePath) || await writeStatus(paths, buildInitialStatus(paths)), {
        statusPath: statusFilePath
    }
}
