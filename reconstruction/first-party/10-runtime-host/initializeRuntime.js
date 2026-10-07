// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: lmt, daemon.pretty.js:69834)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await ensureDirectoryExists(i);
    await or.chmod(e.runDir, 448), await migrateLegacyJobSessionKeys(e), await copyBootstrapIntoKernel(e, t), await refreshBootstrapDuoduoMdFiles(e), await ensureDirectoryExists(e.memoryDir), await ensureDirectoryExists(e.memoryEntitiesDir), await ensureDirectoryExists(e.memoryTopicsDir), await ensureDirectoryExists(e.memoryFragmentsDir), await ensureDirectoryExists(e.memoryStateDir), await ensureDirectoryExists(e.subconsciousDir), await ensureDirectoryExists(e.subconsciousVarDir), await ensureDirectoryExists(e.partitionStateDir), await ensureDirectoryExists(sr.join(e.kernelDir, ".claude")), await fU(e.subconsciousPlaylistPath, rmt), await fU(e.memoryBroadcastPath, imt), await retireListedPartitions(e), await ensureKernelGitRepo(e.kernelDir), await generateAllPartitionCodexAgents(e);
    let r = resolveRegistryStatusPath(e);
    return await pathExistsAsync(r) || await writeRegistryStatusFile(e, buildInitialRegistryStatus(e)), {
        statusPath: r
    }
}
