// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: initializeRuntime  (minified: AKe, daemon.pretty.js:59220)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function initializeRuntime(e, t = process.env) {
 let n = Ho(t);
 await archiveLegacyRegistrySessionsDir(e);
 let r = [e.runtimeDir, e.varDir, e.runDir, e.eventsDir, e.eventsIndexDir, e.registryDir, e.outboxDir, e.sessionsDir, e.jobsDir, e.varIngressDir, e.telemetryDir, e.usageDir, e.cadenceDir, e.cadenceInboxDir, e.runLocksDir, e.runQueueOffsetsDir, e.kernelDir, e.workDir];
 for (let o of r) await ye(o);
 await PKe(e, t), await IKe(e), await ye(e.memoryDir), await ye(e.memoryEntitiesDir), await ye(e.memoryTopicsDir), await ye(e.memoryFragmentsDir), await ye(e.memoryStateDir), await ye(e.subconsciousDir), await ye(e.subconsciousVarDir), await ye(e.partitionStateDir), await ye(_n.join(e.kernelDir, ".claude")), await Sg(e.cadenceQueuePath, wKe), await Sg(e.subconsciousPlaylistPath, SKe), await Sg(e.memoryBroadcastPath, kKe), await Sg(e.memoryMetaStatePath, xKe), await yle(e.kernelDir), await OKe(e, t, n), await CKe(e, t, n), await NKe(e);
 let i = tk(e);
 return await Us(i) || await KD(e, GD(e)), {
  statusPath: i
 }
}
