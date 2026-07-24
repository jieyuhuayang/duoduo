// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryDirs  (minified: Ac, daemon.pretty.js:42520)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryDirs(e) {
 return {
  memoryDir: e,
  boardPath: Ux.join(e, "CLAUDE.md"),
  entitiesDir: Ux.join(e, "entities"),
  topicsDir: Ux.join(e, "topics"),
  effectivenessDir: Ux.join(e, "effectiveness")
 }
}
