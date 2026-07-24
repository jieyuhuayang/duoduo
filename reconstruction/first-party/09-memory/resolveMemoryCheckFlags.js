// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: gL, daemon.pretty.js:43654)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
 let e = hL("ALADUO_EXP_MEMORY_CHECK"),
  t = hL("ALADUO_EXP_MEMORY_FORGET") && e;
 return {
  check: e,
  forget: t
 }
}
