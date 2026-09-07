// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: krt, daemon.pretty.js:63101)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await Te(i);
    await Wn.chmod(e.runDir, 448), await Jge(e), await Srt(e, t), await wrt(e), await Te(e.memoryDir), await Te(e.memoryEntitiesDir), await Te(e.memoryTopicsDir), await Te(e.memoryFragmentsDir), await Te(e.memoryStateDir), await Te(e.subconsciousDir), await Te(e.subconsciousVarDir), await Te(e.partitionStateDir), await Te(Jn.join(e.kernelDir, ".claude")), await R1(e.subconsciousPlaylistPath, yrt), await R1(e.memoryBroadcastPath, _rt), await Yge(e), await Bge(e.kernelDir), await xrt(e);
    let r = PE(e);
    return await is(r) || await L1(e, j1(e)), {
        statusPath: r
    }
}
