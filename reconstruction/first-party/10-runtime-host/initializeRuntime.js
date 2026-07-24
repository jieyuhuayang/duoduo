// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: m5e, daemon.pretty.js:58794)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.cadenceInboxDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await ge(i);
    await p5e(e, t), await f5e(e), await ge(e.memoryDir), await ge(e.memoryEntitiesDir), await ge(e.memoryTopicsDir), await ge(e.memoryFragmentsDir), await ge(e.memoryStateDir), await ge(e.subconsciousDir), await ge(e.subconsciousVarDir), await ge(e.partitionStateDir), await ge(Bn.join(e.kernelDir, ".claude")), await Mg(e.cadenceQueuePath, o5e), await Mg(e.subconsciousPlaylistPath, a5e), await Mg(e.memoryBroadcastPath, u5e), await Mg(e.memoryMetaStatePath, c5e), await Jle(e.kernelDir), await h5e(e);
    let r = xk(e);
    return await dm(r) || await h1(e, m1(e)), {
        statusPath: r
    }
}
