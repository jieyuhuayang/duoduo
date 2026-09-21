// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: Sdt, daemon.pretty.js:69546)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
    await archiveLegacyRegistrySessionsDir(e);
    let n = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
    for (let i of n) await Oe(i);
    await er.chmod(e.runDir, 448), await Vwe(e), await wdt(e, t), await vdt(e), await Oe(e.memoryDir), await Oe(e.memoryEntitiesDir), await Oe(e.memoryTopicsDir), await Oe(e.memoryFragmentsDir), await Oe(e.memoryStateDir), await Oe(e.subconsciousDir), await Oe(e.subconsciousVarDir), await Oe(e.partitionStateDir), await Oe(tr.join(e.kernelDir, ".claude")), await cz(e.subconsciousPlaylistPath, gdt), await cz(e.memoryBroadcastPath, ydt), await Zwe(e), await zwe(e.kernelDir), await kdt(e);
    let r = gR(e);
    return await $s(r) || await vz(e, bz(e)), {
        statusPath: r
    }
}
