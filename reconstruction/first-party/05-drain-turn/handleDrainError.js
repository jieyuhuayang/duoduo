// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: handleDrainError  (minified: oR, daemon.pretty.js:61621)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function handleDrainError(e, t, n) {
 let r = n.error instanceof Error ? n.error.message : String(n.error),
  i = r.length > 4e3 ? r.slice(0, 4e3) + "…" : r,
  o = n.userText ?? `[duoduo:drain-error] agent turn failed at ${n.stage}.

${i}

` + L5e(r);
 try {
  await es(e, t, {
   item: n.anchor.item,
   event: n.anchor.event,
   outputText: o
  })
 } catch (a) {
  ee("[runner] failed to emit drain-error outbox record", {
   sessionKey: t,
   stage: n.stage,
   emitError: a instanceof Error ? a.message : String(a)
  })
 }
 let s = createSpineEvent({
  type: "agent.error",
  source: {
   kind: "runner",
   name: "runner"
  },
  session_key: n.anchor.event.session_key ?? t,
  payload: {
   stage: n.stage,
   error: r,
   ...n.payloadExtra ?? {}
  }
 });
 try {
  await atomicAppendEvent(e, s)
 } catch (a) {
  ee("[runner] failed to append agent.error to spine", {
   sessionKey: t,
   stage: n.stage,
   spineError: a instanceof Error ? a.message : String(a)
  })
 }
}
