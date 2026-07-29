// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: I5e, daemon.pretty.js:58916)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.cadenceInboxDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await _e(i);
    await R5e(e, t), await T5e(e), await _e(e.memoryDir), await _e(e.memoryEntitiesDir), await _e(e.memoryTopicsDir), await _e(e.memoryFragmentsDir), await _e(e.memoryStateDir), await _e(e.subconsciousDir), await _e(e.subconsciousVarDir), await _e(e.partitionStateDir), await _e(Vn.join(e.kernelDir, ".claude")), await Ug(e.cadenceQueuePath, v5e), await Ug(e.subconsciousPlaylistPath, w5e), await Ug(e.memoryBroadcastPath, S5e), await Ug(e.memoryMetaStatePath, k5e), await ide(e.kernelDir), await P5e(e);
    let r = xk(e);
    return await mm(r) || await h1(e, m1(e)), {
        statusPath: r
    }
}
