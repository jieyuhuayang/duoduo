// duoduo reconstruction — subsystem: 09-memory
// symbol: buildMemoryCheckStatus  (minified: yL, daemon.pretty.js:43663)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildMemoryCheckStatus(e) {
 let t = resolveMemoryCheckFlags(),
  n;
 try {
  n = koe(e.subconsciousDir)
 } catch {
  n = void 0
 }
 return {
  check_enabled: t.check,
  forget_enabled: t.forget,
  partitions: n
 }
}
