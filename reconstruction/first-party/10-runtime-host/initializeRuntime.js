// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: Rdt, daemon.pretty.js:69543)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await $e(i);
    await tr.chmod(e.runDir, 448), await migrateLegacyJobSessionKeys(e), await copyBootstrapIntoKernel(e, t), await refreshBootstrapDuoduoMdFiles(e), await $e(e.memoryDir), await $e(e.memoryEntitiesDir), await $e(e.memoryTopicsDir), await $e(e.memoryFragmentsDir), await $e(e.memoryStateDir), await $e(e.subconsciousDir), await $e(e.subconsciousVarDir), await $e(e.partitionStateDir), await $e(nr.join(e.kernelDir, ".claude")), await dz(e.subconsciousPlaylistPath, vdt), await dz(e.memoryBroadcastPath, wdt), await retireListedPartitions(e), await ensureKernelGitRepo(e.kernelDir), await generateAllPartitionCodexAgents(e);
    let r = resolveRegistryStatusPath(e);
    return await pathExistsAsync(r) || await wz(e, vz(e)), {
        statusPath: r
    }
}
