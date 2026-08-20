// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: SQe, daemon.pretty.js:61175)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.cadenceInboxDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await xe(i);
    await nr.chmod(e.runDir, 448), await wQe(e, t), await vQe(e), await xe(e.memoryDir), await xe(e.memoryEntitiesDir), await xe(e.memoryTopicsDir), await xe(e.memoryFragmentsDir), await xe(e.memoryStateDir), await xe(e.subconsciousDir), await xe(e.subconsciousVarDir), await xe(e.partitionStateDir), await xe(rr.join(e.kernelDir, ".claude")), await Ay(e.cadenceQueuePath, mQe), await Ay(e.subconsciousPlaylistPath, hQe), await Ay(e.memoryBroadcastPath, gQe), await Ay(e.memoryMetaStatePath, yQe), await Pme(e.kernelDir), await kQe(e);
    let r = Qx(e);
    return await rh(r) || await Yj(e, Kj(e)), {
        statusPath: r
    }
}
