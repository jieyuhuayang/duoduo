// duoduo reconstruction — subsystem: 09-memory
// symbol: runMemoryCheckTick  (minified: UJe, daemon.pretty.js:43678)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runMemoryCheckTick(e, t) {
 let {
  check: n,
  forget: r
 } = resolveMemoryCheckFlags();
 hL("ALADUO_EXP_MEMORY_FORGET") && !n && Xe("[memory] ALADUO_EXP_MEMORY_FORGET is set but ALADUO_EXP_MEMORY_CHECK is not — forgetting is DISABLED this tick. FORGET requires CHECK so a node is warned (NEWBORN) before it can be forgotten (STALE). Enable ALADUO_EXP_MEMORY_CHECK too.");
 let o = {
   checkEnabled: n,
   forgetEnabled: r,
   posted: [],
   withheld: [],
   forgotten: [],
   sparedUnwarnable: []
  },
  s = {
   subconsciousDir: e.subconsciousDir,
   varDir: e.varDir,
   flagFallback: n
  },
  a = qJe(() => Eoe(s));
 if (!a && !r) return o;
 let c = e.memoryDir,
  u = d => {
   let p = xoe(d, s);
   o.posted.push(...p.posted), o.withheld.push(...p.withheld);
   for (let f of p.errors) Xe(`[memory] pending delivery failed: ${f}`)
  },
  l = null;
 return $l("orphan-states", () => {
  let d = detectOrphanMemory(c, {
   refTimestampMs: t
  });
  d.missing || (l = d.states)
 }), a && ($l("board-lint", () => {
  u(Qie(c, mL)
   .selections)
 }), $l("entity-lint", () => {
  u(ioe(c, mL)
   .selected)
 }), $l("node-lint", () => {
  u(soe(c, mL)
   .selected)
 }), $l("gap-lint", () => {
  u(runGapLint(e.eventsDir, c)
   .selected)
 }), $l("orphan-newborn-island", () => {
  if (l === null) return;
  u(hoe(l));
  let d = _oe(yoe(l), t);
  d && u([d])
 })), r && $l("orphan-forget", () => {
  if (l === null) return;
  let d = [];
  for (let p of l) {
   if (p.state !== "STALE") {
    d.push(p);
    continue
   }
   Toe(s, routeContractDecision(p)) ? d.push(p) : o.sparedUnwarnable.push(p.rel)
  }
  o.forgotten.push(...forgetMemoryEntry(d, e.kernelDir, {
   dryRun: !1
  }))
 }), (o.posted.length > 0 || o.forgotten.length > 0 || o.withheld.length > 0 || o.sparedUnwarnable.length > 0) && ee("[memory] check tick", {
  posted: o.posted.map(d => FJe.basename(d)),
  withheld: o.withheld,
  forgotten: o.forgotten,
  spared_unwarnable: o.sparedUnwarnable
 }), o
}
