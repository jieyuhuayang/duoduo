// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: not, daemon.pretty.js:63688)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await Te(i);
    await Jn.chmod(e.runDir, 448), await Uye(e), await tot(e, t), await eot(e), await Te(e.memoryDir), await Te(e.memoryEntitiesDir), await Te(e.memoryTopicsDir), await Te(e.memoryFragmentsDir), await Te(e.memoryStateDir), await Te(e.subconsciousDir), await Te(e.subconsciousVarDir), await Te(e.partitionStateDir), await Te(Gn.join(e.kernelDir, ".claude")), await eL(e.subconsciousPlaylistPath, Kit), await eL(e.memoryBroadcastPath, Yit), await Vye(e), await jye(e.kernelDir), await rot(e);
    let r = WE(e);
    return await fs(r) || await fL(e, dL(e)), {
        statusPath: r
    }
}
